import { z } from "zod";

export const offerCreateSchema = z.object({
  propertyId: z.string().uuid(),
  amount: z.coerce.number().positive().max(1_000_000_000),
  message: z.string().max(5000).optional(),
});

export const offerStatusSchema = z.object({
  offerId: z.string().uuid(),
  status: z.enum(["ACCEPTED", "REJECTED", "COUNTERED"]),
  counterAmount: z.coerce.number().positive().optional(),
});
