import type { Request, Response } from "express";
import { triageSupport } from "../services/operator-service.js";
import { supportTriageSchema } from "../validators.js";

export function postSupportTriage(req: Request, res: Response): void {
  const parsed = supportTriageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = triageSupport(parsed.data as Parameters<typeof triageSupport>[0]);
  res.json(output);
}
