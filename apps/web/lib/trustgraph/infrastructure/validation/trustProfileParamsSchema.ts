import { z } from "zod";

const subjectTypeSchema = z.enum(["user", "listing", "broker", "property_owner", "host"]);

export const trustProfileParamsSchema = z.object({
  subjectType: subjectTypeSchema,
  subjectId: z.string().min(1),
});

export type TrustProfileParams = z.infer<typeof trustProfileParamsSchema>;
