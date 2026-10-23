import { Router } from "express";
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { AppError } from "../utils/AppError.js";
import { doctorBody, patientBody, parseBody, parseListQuery, textSearchFilter } from "../utils/validation.js";

const router = Router();
router.use(requireAdmin);

function serializeDoctor(doctor) {
  return {
    id: doctor._id.toString(),
    name: doctor.name,
    specialization: doctor.specialization,
    hospital: doctor.hospital,
    phone: doctor.phone,
    email: doctor.email,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}

function serializePatient(patient) {
  const doctor = patient.doctor && typeof patient.doctor === "object" ? patient.doctor : null;
  return {
    id: patient._id.toString(),
    name: patient.name,
    age: patient.age,
    condition: patient.condition,
    phone: patient.phone || "",
    notes: patient.notes || "",
    doctor: doctor ? { id: doctor._id.toString(), name: doctor.name } : { id: String(patient.doctor), name: "" },
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

function validObjectId(value, label) {
  if (!mongoose.isValidObjectId(value)) throw new AppError(400, `${label} is invalid.`, "INVALID_ID");
}

router.get("/", async (req, res) => {
  const query = parseListQuery(req.query);
  const filter = {};
  if (query.createdAtFilter) filter.createdAt = query.createdAtFilter;
  if (query.specializationKey) filter.specializationKey = query.specializationKey;
  const text = textSearchFilter(query.q);
  if (text) filter.$text = text.$text;

  const [records, total] = await Promise.all([
    Doctor.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Doctor.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: records.map(serializeDoctor),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    },
  });
});

router.post("/", async (req, res) => {
  const values = parseBody(doctorBody, req.body);
  const doctor = await Doctor.create({ ...values, specializationKey: values.specialization.toLowerCase() });
  res.status(201).json({ success: true, data: { doctor: serializeDoctor(doctor) } });
});

router.get("/specializations", async (_req, res) => {
  const specializations = await Doctor.distinct("specialization");
  res.json({ success: true, data: { specializations: specializations.sort((a, b) => a.localeCompare(b)).slice(0, 100) } });
});

router.get("/:doctorId/patients", async (req, res) => {
  validObjectId(req.params.doctorId, "Doctor ID");
  const doctor = await Doctor.findById(req.params.doctorId).select("_id").lean();
  if (!doctor) throw new AppError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");

  const query = parseListQuery(req.query);
  const filter = { doctor: doctor._id };
  if (query.createdAtFilter) filter.createdAt = query.createdAtFilter;
  const text = textSearchFilter(query.q);
  if (text) filter.$text = text.$text;

  const [records, total] = await Promise.all([
    Patient.find(filter)
      .select("-conditionKey")
      .populate("doctor", "name")
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: records.map(serializePatient),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    },
  });
});

router.post("/:doctorId/patients", async (req, res) => {
  validObjectId(req.params.doctorId, "Doctor ID");
  const doctor = await Doctor.findById(req.params.doctorId).select("_id").lean();
  if (!doctor) throw new AppError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");

  const values = parseBody(patientBody, req.body);
  const patient = await Patient.create({
    ...values,
    conditionKey: values.condition.toLowerCase(),
    doctor: doctor._id,
  });
  const populated = await Patient.findById(patient._id).select("-conditionKey").populate("doctor", "name").lean();
  res.status(201).json({ success: true, data: { patient: serializePatient(populated) } });
});

router.delete("/:doctorId/patients/:patientId", async (req, res) => {
  validObjectId(req.params.doctorId, "Doctor ID");
  validObjectId(req.params.patientId, "Patient ID");
  const patient = await Patient.findOneAndDelete({ _id: req.params.patientId, doctor: req.params.doctorId }).lean();
  if (!patient) throw new AppError(404, "Patient not found for this doctor.", "PATIENT_NOT_FOUND");
  res.json({ success: true, data: { deleted: true } });
});

router.get("/:doctorId", async (req, res) => {
  validObjectId(req.params.doctorId, "Doctor ID");
  const doctor = await Doctor.findById(req.params.doctorId).lean();
  if (!doctor) throw new AppError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");
  res.json({ success: true, data: { doctor: serializeDoctor(doctor) } });
});

export default router;
