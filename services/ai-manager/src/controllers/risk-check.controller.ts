import type { Request, Response } from "express";
import { runRiskCheck } from "../services/risk-check.service.js";
import { riskCheckSchema } from "../validators.js";

export function postRiskCheck(req: Request, res: Response): void {
  const parsed = riskCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = runRiskCheck(parsed.data);
  res.json(result);
}
