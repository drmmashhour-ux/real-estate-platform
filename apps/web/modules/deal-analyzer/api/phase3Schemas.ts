import { z } from "zod";

export const runOfferStrategyBodySchema = z.object({
  strategyMode: z
    .enum(["buy_to_live", "buy_to_rent", "buy_to_flip", "buy_for_bnhub", "hold_long_term"])
    .optional()
    .nullable(),
});

export type RunOfferStrategyBody = z.infer<typeof runOfferStrategyBodySchema>;

export const runAffordabilityBodySchema = z.object({
  downPaymentCents: z.number().int().nonnegative().optional().nullable(),
  annualRate: z.number().min(0).max(0.25).optional().nullable(),
  termYears: z.number().int().min(5).max(40).optional().nullable(),
  monthlyIncomeCents: z.number().int().nonnegative().optional().nullable(),
  monthlyDebtsCents: z.number().int().nonnegative().optional().nullable(),
});

export type RunAffordabilityBody = z.infer<typeof runAffordabilityBodySchema>;

export const createWatchlistBodySchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateWatchlistBodySchema = z.object({
  name: z.string().min(1).max(120),
});

export const addWatchlistItemBodySchema = z.object({
  propertyId: z.string().min(1),
});
