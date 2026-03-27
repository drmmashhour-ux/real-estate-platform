import express from "express";
import { createAiRouter } from "./routes.js";
import { config } from "./config.js";

const app = express();
app.use(express.json());

app.use(config.basePath, createAiRouter());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ai" });
});

export { app };
