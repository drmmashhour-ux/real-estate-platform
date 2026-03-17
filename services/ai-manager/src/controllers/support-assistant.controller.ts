import type { Request, Response } from "express";
import { runSupportAssistant } from "../services/support-assistant.service.js";
import { supportAssistantSchema } from "../validators.js";

export function postSupportAssistant(req: Request, res: Response): void {
  const parsed = supportAssistantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = runSupportAssistant(parsed.data);
  res.json(result);
}
