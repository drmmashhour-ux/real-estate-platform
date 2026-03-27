import type { Request, Response } from "express";
import { getPricingSuggestion } from "../services/pricing-suggestion.service.js";
import { pricingSuggestionSchema } from "../validators.js";

export function postPricingSuggestion(req: Request, res: Response): void {
  const parsed = pricingSuggestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = getPricingSuggestion(parsed.data);
  res.json(result);
}
