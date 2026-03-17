import type { Request, Response } from "express";
import { analyzeListing } from "../services/listing-analysis.service.js";
import { listingAnalysisSchema } from "../validators.js";

export function postListingAnalysis(req: Request, res: Response): void {
  const parsed = listingAnalysisSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = analyzeListing(parsed.data);
  res.json(result);
}
