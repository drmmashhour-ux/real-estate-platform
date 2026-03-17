import type { Request, Response } from "express";
import { handleSupport } from "../services/support.service.js";
import { supportSchema } from "../validators.js";

export function postSupport(req: Request, res: Response): void {
  const parsed = supportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const result = handleSupport(parsed.data);
  res.json(result);
}
