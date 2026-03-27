import { z } from "zod";

export const refreshPostBodySchema = z.object({
  force: z.boolean().optional(),
});

export const portfolioMonitoringRunBodySchema = z.object({}).optional();
