import type { Request, Response } from "express";
import { forecastDemand } from "../services/operator-service.js";
import { getDecisions } from "../services/decision-store.js";
import { demandForecastSchema } from "../validators.js";

export function postDemandForecast(req: Request, res: Response): void {
  const parsed = demandForecastSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = forecastDemand(parsed.data as Parameters<typeof forecastDemand>[0]);
  res.json(output);
}

export function getForecastByMarket(req: Request, res: Response): void {
  const market = req.params.market;
  const decisions = getDecisions({ agentType: "demand_forecast", entityType: "market", entityId: market, limit: 1 });
  const last = decisions[0];
  if (!last) {
    res.status(404).json({ error: "No demand forecast found for this market" });
    return;
  }
  res.json(last.outputSummary);
}
