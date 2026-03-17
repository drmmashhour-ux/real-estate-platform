import express from "express";
import { createIncidentsRouter } from "./routes/incidents.js";
import { createFlagsRouter } from "./routes/flags.js";
import { createSuspensionsRouter } from "./routes/suspensions.js";
import { createModerationQueueRouter } from "./routes/moderationQueue.js";

const app = express();
app.use(express.json());

app.use("/v1/incidents", createIncidentsRouter());
app.use("/v1/flags", createFlagsRouter());
app.use("/v1/suspensions", createSuspensionsRouter());
app.use("/v1/moderation/queue", createModerationQueueRouter());

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
});

export { app };
