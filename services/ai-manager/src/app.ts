import express from "express";
import { createAiManagerRouter } from "./routes.js";
import { config } from "./config.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = express();
app.use(express.json());

app.use(config.basePath, createAiManagerRouter());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ai-manager" });
});

startScheduler();

export { app };
