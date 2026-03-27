import { z } from "zod";

export const rerunPhase2BodySchema = z.object({
  financing: z
    .object({
      loanPrincipalCents: z.number().nullable().optional(),
      annualRate: z.number().optional(),
      termYears: z.number().optional(),
    })
    .optional(),
  shortTermListingId: z.string().min(1).optional().nullable(),
});

export type RerunPhase2Body = z.infer<typeof rerunPhase2BodySchema>;

export const portfolioStatusQuerySchema = z.object({
  compareIds: z.string().optional(),
});
