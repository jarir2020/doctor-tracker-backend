/** Doctor Tracker: Starts the local HTTP server and handles process shutdown. */
import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import { disconnectDatabase } from "./config/database.js";

const server = app.listen(env.port, env.host, () => {
  console.info(`Doctor Tracker API listening on ${env.host}:${env.port}`);
});

/** Stop accepting requests before closing the shared database connection. */
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
