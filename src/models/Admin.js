/** Doctor Tracker: Defines the administrator document and protects password hashes from queries. */
import mongoose from "mongoose";

// Password hashes stay excluded unless authentication explicitly requests them.
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 255 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

export const Admin = mongoose.model("Admin", adminSchema);
