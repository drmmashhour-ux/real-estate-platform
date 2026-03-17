import type { Request, Response } from "express";
import { checkBooking } from "../services/operator-service.js";
import { bookingCheckSchema } from "../validators.js";

export function postBookingsCheck(req: Request, res: Response): void {
  const parsed = bookingCheckSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const output = checkBooking(parsed.data as Parameters<typeof checkBooking>[0]);
  res.json(output);
}
