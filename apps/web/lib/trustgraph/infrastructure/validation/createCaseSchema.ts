import { z } from "zod";

export const verificationEntityTypeSchema = z.enum([
  "LISTING",
  "SELLER",
  "BUYER",
  "TENANT",
  "GUEST",
  "BROKER",
  "BOOKING",
  "OFFER",
  "RENTAL_APPLICATION",
  "MORTGAGE_FILE",
  "SELLER_DECLARATION",
  "HOST",
  "SHORT_TERM_LISTING",
]);

export const createCaseBodySchema = z.object({
  entityType: verificationEntityTypeSchema,
  entityId: z.string().min(1, "entityId is required"),
  triggerSource: z.string().max(200).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
});

export type CreateCaseBody = z.infer<typeof createCaseBodySchema>;
