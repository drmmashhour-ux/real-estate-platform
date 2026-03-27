import type { Request, Response } from "express";
import { analyzeListing } from "../services/operator-service.js";
import { listingAnalyzeSchema } from "../validators.js";

export function postListingsAnalyze(req: Request, res: Response): void {
  const parsed = listingAnalyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const photoCount = parsed.data.photoCount ?? parsed.data.photoUrls?.length;
  const payload = { ...parsed.data, photoCount };
  const output = analyzeListing(payload as Parameters<typeof analyzeListing>[0]);
  res.json(output);
}
