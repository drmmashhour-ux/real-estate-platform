import type { Request, Response } from "express";
import { getDemandForecast } from "../services/demand.service.js";
import { demandSchema } from "../validators.js";

export function postDemand(req: Request, res: Response): void {
  const parsed = demandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = getDemandForecast(parsed.data);
  res.json(result);
}
