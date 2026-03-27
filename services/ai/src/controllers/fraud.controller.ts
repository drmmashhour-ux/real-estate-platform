import type { Request, Response } from "express";
import { checkFraud } from "../services/fraud.service.js";
import { fraudCheckSchema } from "../validators.js";

export function postFraudCheck(req: Request, res: Response): void {
  const parsed = fraudCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = checkFraud(parsed.data);
  res.json(result);
}
