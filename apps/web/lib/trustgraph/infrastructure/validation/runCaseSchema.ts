import { z } from "zod";

export const runCaseParamsSchema = z.object({
  id: z.string().uuid(),
});

export type RunCaseParams = z.infer<typeof runCaseParamsSchema>;
