import express from "express";
import { requireUserId } from "./authContext.js";
import { createConversationsRouter } from "./routes/conversations.js";

const app = express();
app.use(express.json());

app.use("/v1/conversations", requireUserId, createConversationsRouter());

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
});

export { app };
