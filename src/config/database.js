/** Doctor Tracker: Owns the Mongoose connect and disconnect lifecycle. */
import mongoose from "mongoose";
import { env } from "./env.js";

/** Connect Mongoose before the HTTP server begins accepting requests. */
export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });
  console.info("MongoDB connected");
}

/** Close the shared MongoDB connection during shutdown. */
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
