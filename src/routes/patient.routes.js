/** Doctor Tracker: Implements authenticated patient search, updates, and deletion endpoints. */
import { Router } from "express";
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { AppError } from "../utils/AppError.js";
import { patientPatchBody, parseBody, parseListQuery, textSearchFilter } from "../utils/validation.js";

const router = Router();
router.use(requireAdmin);

/** Convert a patient document with an optional populated doctor to API data. */
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

/** Reject malformed patient IDs before running a database operation. */
function validObjectId(value) {
  if (!mongoose.isValidObjectId(value)) throw new AppError(400, "Patient ID is invalid.", "INVALID_ID");
}

// Supply condition values for the patient directory filter.
router.get("/conditions", async (req, res) => {
  const values = await Patient.distinct("condition");
  res.json({ success: true, data: { conditions: values.sort((a, b) => a.localeCompare(b)).slice(0, 100) } });
});

// Return filtered patient records with their doctor names and paging totals.
router.get("/", async (req, res) => {
  const query = parseListQuery(req.query);
  const filter = {};
  if (query.createdAtFilter) filter.createdAt = query.createdAtFilter;
  if (query.conditionKey) filter.conditionKey = query.conditionKey;
  if (query.doctorId) filter.doctor = query.doctorId;
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

// Apply only validated fields, including an optional reassignment to another doctor.
router.patch("/:patientId", async (req, res) => {
  validObjectId(req.params.patientId);
  const values = parseBody(patientPatchBody, req.body);
  // Keep the searchable normalized key in sync when a condition is edited.
  if (values.condition) values.conditionKey = values.condition.toLowerCase();

  if (values.doctorId) {
    // Verify the doctor exists before translating the public ID to a database reference.
    const doctor = await Doctor.findById(values.doctorId).select("_id").lean();
    if (!doctor) throw new AppError(404, "Doctor not found.", "DOCTOR_NOT_FOUND");
    values.doctor = doctor._id;
    delete values.doctorId;
  }

  const patient = await Patient.findByIdAndUpdate(req.params.patientId, { $set: values }, {
    new: true,
    runValidators: true,
  }).select("-conditionKey").populate("doctor", "name").lean();

  if (!patient) throw new AppError(404, "Patient not found.", "PATIENT_NOT_FOUND");
  res.json({ success: true, data: { patient: serializePatient(patient) } });
});

// Remove a patient record by ID after validating the identifier.
router.delete("/:patientId", async (req, res) => {
  validObjectId(req.params.patientId);
  const patient = await Patient.findByIdAndDelete(req.params.patientId).lean();
  if (!patient) throw new AppError(404, "Patient not found.", "PATIENT_NOT_FOUND");
  res.json({ success: true, data: { deleted: true } });
});

export default router;
