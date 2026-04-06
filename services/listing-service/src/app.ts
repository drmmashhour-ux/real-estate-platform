import express, { type Application } from "express";
import { authMiddleware } from "./authMiddleware.js";
import { createPropertiesRouter } from "./routes/properties.js";

const app: Application = express();
app.use(express.json());

app.use("/v1/properties", authMiddleware, createPropertiesRouter());

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
});

export { app };
