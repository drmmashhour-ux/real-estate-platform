import type { Request, Response } from "express";
import { analyzeListingQuality } from "../services/listing-quality.service.js";
import { listingQualitySchema } from "../validators.js";

export function postListingQuality(req: Request, res: Response): void {
  const parsed = listingQualitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const input = parsed.data;
  const payload = {
    ...input,
    photoCount: input.photoCount ?? input.photoUrls?.length,
  };
  const result = analyzeListingQuality(payload);
  res.json(result);
}
