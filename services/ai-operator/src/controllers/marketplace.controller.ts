import type { Request, Response } from "express";
import { checkMarketplaceHealth } from "../services/operator-service.js";
import { marketplaceHealthSchema } from "../validators.js";

export function postMarketplaceHealth(req: Request, res: Response): void {
  const parsed = marketplaceHealthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = checkMarketplaceHealth(parsed.data as Parameters<typeof checkMarketplaceHealth>[0]);
  res.json(output);
}
