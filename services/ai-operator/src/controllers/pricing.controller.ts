import type { Request, Response } from "express";
import { recommendPricing } from "../services/operator-service.js";
import { getDecisions } from "../services/decision-store.js";
import { pricingRecommendSchema } from "../validators.js";

export function postPricingRecommend(req: Request, res: Response): void {
  const parsed = pricingRecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = recommendPricing(parsed.data as Parameters<typeof recommendPricing>[0]);
  res.json(output);
}

export function getPricingByListingId(req: Request, res: Response): void {
  const listingId = req.params.listingId;
  const decisions = getDecisions({ agentType: "pricing", entityType: "listing", entityId: listingId, limit: 1 });
  const last = decisions[0];
  if (!last) {
    res.status(404).json({ error: "No pricing recommendation found for this listing" });
    return;
  }
  res.json(last.outputSummary);
}
