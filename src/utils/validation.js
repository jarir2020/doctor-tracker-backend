import { z } from "zod";
import { AppError } from "./AppError.js";

const trimmedText = (max, label) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`);

export const loginBody = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const doctorBody = z.object({
  name: trimmedText(100, "Name"),
  specialization: trimmedText(100, "Specialization"),
  hospital: trimmedText(150, "Hospital"),
  phone: trimmedText(40, "Phone"),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
});

const patientFields = {
  name: trimmedText(100, "Name"),
  age: z.union([z.number().int().min(0).max(130), z.null()]).optional(),
  condition: trimmedText(120, "Condition"),
  phone: z.string().trim().max(40).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
};

export const patientBody = z.object(patientFields);
export const patientPatchBody = z.object({
  ...patientFields,
  doctorId: z.string().regex(/^[a-f\d]{24}$/i, "Doctor ID is invalid.").optional(),
}).partial().refine((data) => Object.keys(data).length > 0, {
  message: "Provide at least one field to update.",
});

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  page: z.coerce.number().int().min(1).max(1_000_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  condition: z.string().trim().max(120).optional(),
  specialization: z.string().trim().max(100).optional(),
  doctorId: z.string().optional(),
});

function validDate(value) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, "Use valid YYYY-MM-DD dates for date filters.", "INVALID_DATE");
  }
  return parsed;
}

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(" ");
    throw new AppError(400, message || "Request data is invalid.", "VALIDATION_ERROR");
  }
  return result.data;
}

export function parseListQuery(query) {
  const result = listQuerySchema.safeParse(query);
  if (!result.success) {
    throw new AppError(400, "Search, filter, or pagination parameters are invalid.", "INVALID_QUERY");
  }

  const values = result.data;
  const fromDate = validDate(values.from);
  const toDate = validDate(values.to);
  if (fromDate && toDate && fromDate > toDate) {
    throw new AppError(400, "The start date must be on or before the end date.", "INVALID_DATE_RANGE");
  }
  if (values.doctorId && !/^[a-f\d]{24}$/i.test(values.doctorId)) {
    throw new AppError(400, "Doctor ID is invalid.", "INVALID_DOCTOR_ID");
  }

  const createdAt = {};
  if (fromDate) createdAt.$gte = fromDate;
  if (toDate) {
    const exclusiveEnd = new Date(toDate);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    createdAt.$lt = exclusiveEnd;
  }

  return {
    ...values,
    fromDate,
    toDate,
    createdAtFilter: Object.keys(createdAt).length ? createdAt : null,
    conditionKey: values.condition?.trim().toLowerCase(),
    specializationKey: values.specialization?.trim().toLowerCase(),
  };
}

export function textSearchFilter(q) {
  if (!q) return null;
  const terms = q.replace(/[^\p{L}\p{N}@._+-]+/gu, " ").trim();
  return terms ? { $text: { $search: terms } } : null;
}
