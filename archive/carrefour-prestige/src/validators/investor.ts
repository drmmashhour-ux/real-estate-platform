import { z } from "zod";

export const investorAnalysisSchema = z.object({
  name: z.string().max(120).optional(),
  purchasePrice: z.coerce.number().positive(),
  monthlyRent: z.coerce.number().nonnegative(),
  annualExpenses: z.coerce.number().nonnegative(),
  vacancyRatePct: z.coerce.number().min(0).max(100).default(5),
});
