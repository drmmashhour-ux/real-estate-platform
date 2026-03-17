import express from "express";
import { createOperatorRouter } from "./routes.js";
import { config } from "./config.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = express();
app.use(express.json());

app.use(config.basePath, createOperatorRouter());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ai-operator" });
});

startScheduler();

export { app };
