import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

await connectDatabase();
const server = app.listen(env.port, env.host, () => {
  console.info(`Doctor Tracker API listening on ${env.host}:${env.port}`);
});

async function shutdown(signal) {
  console.info(`${signal} received; shutting down`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
  server.close(() => process.exit(1));
});
