import { z } from "zod";

export const humanReviewActionTypeSchema = z.enum([
  "approve",
  "reject",
  "request_info",
  "override_score",
  "dismiss_signal",
  "escalate",
  "assign",
]);

export const reviewActionBodySchema = z
  .object({
    actionType: humanReviewActionTypeSchema,
    notes: z.string().max(10_000).optional().nullable(),
    payload: z.record(z.string(), z.any()).optional(),
    newOverallScore: z.number().min(0).max(100).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.actionType === "override_score" && val.newOverallScore === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "newOverallScore is required for override_score",
        path: ["newOverallScore"],
      });
    }
    if (val.actionType === "dismiss_signal") {
      const sid = val.payload && typeof val.payload === "object" && val.payload !== null ? (val.payload as Record<string, unknown>).signalId : undefined;
      if (typeof sid !== "string" || sid.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "payload.signalId (UUID) is required for dismiss_signal",
          path: ["payload"],
        });
      }
    }
  });

export type ReviewActionBody = z.infer<typeof reviewActionBodySchema>;
