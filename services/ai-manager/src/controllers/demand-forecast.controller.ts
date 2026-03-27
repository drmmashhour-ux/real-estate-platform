import type { Request, Response } from "express";
import { getDemandForecast } from "../services/demand-forecast.service.js";
import { demandForecastSchema } from "../validators.js";

export function postDemandForecast(req: Request, res: Response): void {
  const parsed = demandForecastSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = getDemandForecast(parsed.data);
  res.json(result);
}
