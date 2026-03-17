import type { Request, Response } from "express";
import { evaluateFraud } from "../services/operator-service.js";
import { fraudEvaluateSchema } from "../validators.js";

export function postFraudEvaluate(req: Request, res: Response): void {
  const parsed = fraudEvaluateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = evaluateFraud(parsed.data as Parameters<typeof evaluateFraud>[0]);
  res.json(output);
}
