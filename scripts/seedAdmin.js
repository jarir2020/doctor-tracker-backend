/** Doctor Tracker: Creates or refreshes the configured demo administrator with a hashed password. */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { env } from "../src/config/env.js";
import { Admin } from "../src/models/Admin.js";

// Refuse to create a demo account with missing or weak seed credentials.
if (!env.adminEmail || !env.adminPassword || env.adminPassword.length < 12) {
  throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters before seeding.");
}

try {
  await connectDatabase();
  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await Admin.findOneAndUpdate(
    { email: env.adminEmail },
    { $set: { name: env.adminName, email: env.adminEmail, passwordHash } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.info(`Administrator account is ready for ${env.adminEmail}`);
} finally {
  await disconnectDatabase();
}
