/** Doctor Tracker: Defines doctor records and indexes used for uniqueness, sorting, and search. */
import mongoose from "mongoose";

// Store a normalized specialty key separately for indexed case-insensitive filters.
const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    specialization: { type: String, required: true, trim: true, maxlength: 100 },
    specializationKey: { type: String, required: true, trim: true, select: false },
    hospital: { type: String, required: true, trim: true, maxlength: 150 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
  },
  { timestamps: true },
);

// These indexes support uniqueness, newest-first lists, filtering, and text search.
doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({ specializationKey: 1, createdAt: -1 });
doctorSchema.index({ name: "text", specialization: "text", hospital: "text", email: "text" });

export const Doctor = mongoose.model("Doctor", doctorSchema);
