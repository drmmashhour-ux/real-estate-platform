/**
 * Request validation for Marketing Studio project APIs (Zod).
 * Keeps validation out of shared routes — additive only.
 */
import { z } from "zod";

const nonArrayObject = z.custom<object>(
  (v) => typeof v === "object" && v !== null && !Array.isArray(v),
  { message: "Must be a JSON object (not an array)" }
);

export const marketingProjectCreateBodySchema = z.object({
  title: z
    .string()
    .max(200)
    .optional()
    .transform((s) => {
      if (s === undefined || s === null) return undefined;
      const t = String(s).trim();
      return t.length ? t.slice(0, 200) : undefined;
    }),
  projectData: nonArrayObject,
});

export const marketingProjectUpdateBodySchema = z
  .object({
    title: z
      .string()
      .max(200)
      .optional()
      .transform((s) => {
        if (s === undefined || s === null) return undefined;
        const t = String(s).trim();
        return t.length ? t.slice(0, 200) : undefined;
      }),
    projectData: nonArrayObject.optional(),
  })
  .refine((d) => d.title !== undefined || d.projectData !== undefined, {
    message: "Provide title and/or projectData",
  });

export type MarketingProjectCreateBody = z.infer<typeof marketingProjectCreateBodySchema>;
export type MarketingProjectUpdateBody = z.infer<typeof marketingProjectUpdateBodySchema>;
