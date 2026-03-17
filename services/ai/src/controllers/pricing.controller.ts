import type { Request, Response } from "express";
import { getPricingRecommendation } from "../services/pricing.service.js";
import { pricingSchema } from "../validators.js";

export function postPricing(req: Request, res: Response): void {
  const parsed = pricingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = getPricingRecommendation(parsed.data);
  res.json(result);
}
