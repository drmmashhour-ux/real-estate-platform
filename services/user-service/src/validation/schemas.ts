import { z } from "zod";

const optionalString = z.string().optional().nullable().transform((s) => s?.trim() || null);
const localeSchema = z.string().regex(/^[a-z]{2}(_[A-Z]{2})?$/).optional().nullable();

export const patchMeBodySchema = z.object({
  name: optionalString,
  phone: optionalString,
  locale: localeSchema,
  timezone: z.string().max(64).optional().nullable(),
});

export const patchSettingsBodySchema = z.object({
  settings: z.record(z.unknown()),
});

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
export type PatchSettingsBody = z.infer<typeof patchSettingsBodySchema>;
