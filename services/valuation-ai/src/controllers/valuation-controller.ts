import type { Request, Response } from "express";
import { requestValuation } from "../services/valuation-service.js";
import type { ValuationType } from "../models/types.js";

export async function handleSaleValuation(req: Request, res: Response): Promise<void> {
  try {
    const { property_identity_id, listing_id } = req.body ?? {};
    if (!property_identity_id) {
      res.status(400).json({ error: "property_identity_id is required" });
      return;
    }
    const out = await requestValuation("sale", property_identity_id, listing_id);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}

export async function handleLongTermRentValuation(req: Request, res: Response): Promise<void> {
  try {
    const { property_identity_id, listing_id } = req.body ?? {};
    if (!property_identity_id) {
      res.status(400).json({ error: "property_identity_id is required" });
      return;
    }
    const out = await requestValuation("long_term_rental", property_identity_id, listing_id);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}

export async function handleShortTermRentValuation(req: Request, res: Response): Promise<void> {
  try {
    const { property_identity_id, listing_id } = req.body ?? {};
    if (!property_identity_id) {
      res.status(400).json({ error: "property_identity_id is required" });
      return;
    }
    const out = await requestValuation("short_term_rental", property_identity_id, listing_id);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}

export async function handleInvestmentValuation(req: Request, res: Response): Promise<void> {
  try {
    const { property_identity_id, listing_id } = req.body ?? {};
    if (!property_identity_id) {
      res.status(400).json({ error: "property_identity_id is required" });
      return;
    }
    const out = await requestValuation("investment", property_identity_id, listing_id);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
