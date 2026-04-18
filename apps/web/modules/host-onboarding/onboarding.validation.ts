import { z } from "zod";

export const createHostLeadSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(40).optional(),
  city: z.string().max(128).optional(),
  propertyType: z.string().max(64).optional(),
  listingUrl: z.string().url().max(2000).optional(),
  source: z.string().max(64).optional(),
  sourceDetail: z.string().max(256).optional(),
});

export const onboardingStepSchema = z.object({
  sessionId: z.string().min(8).max(64),
  stepKey: z.string().min(1).max(64),
  data: z.record(z.string(), z.unknown()),
});

export const listingImportSchema = z.object({
  sourcePlatform: z.string().min(1).max(64),
  sourceUrl: z.string().url().max(2000),
  leadId: z.string().optional(),
});
