import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, min: 0, max: 130, default: null },
    condition: { type: String, required: true, trim: true, maxlength: 120 },
    conditionKey: { type: String, required: true, trim: true, select: false },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
  },
  { timestamps: true },
);

patientSchema.index({ doctor: 1, createdAt: -1, _id: -1 });
patientSchema.index({ conditionKey: 1, createdAt: -1 });
patientSchema.index({ createdAt: -1, _id: -1 });
patientSchema.index({ name: "text", condition: "text", phone: "text" });

export const Patient = mongoose.model("Patient", patientSchema);
