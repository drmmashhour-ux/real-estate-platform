import type { Request, Response } from "express";
import { getHostInsights } from "../services/host-insights.service.js";
import { hostInsightsSchema } from "../validators.js";

export function postHostInsights(req: Request, res: Response): void {
  const parsed = hostInsightsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { occupancyData, revenueData, listingQualityScore, pricingSuggestion } = (req.body as Record<string, unknown>) as {
    occupancyData?: { date: string; occupancyPct: number }[];
    revenueData?: { date: string; revenueCents: number }[];
    listingQualityScore?: number;
    pricingSuggestion?: { recommendedNightlyCents: number };
  };
  const result = getHostInsights(parsed.data, {
    occupancyData,
    revenueData,
    listingQualityScore,
    pricingSuggestion,
  });
  res.json(result);
}
