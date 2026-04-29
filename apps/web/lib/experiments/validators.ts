import "server-only";

import { z } from "zod";
import { EXPERIMENT_EVENT_NAMES } from "@/lib/experiments/constants";

const trafficSplitSchema = z
  .record(z.string(), z.number().nonnegative())
  .refine((o) => Object.keys(o).length > 0, "traffic split must have at least one variant key");

export type TrafficSplit = z.infer<typeof trafficSplitSchema>;

export function parseTrafficSplitJson(raw: unknown): TrafficSplit {
  return trafficSplitSchema.parse(raw);
}

export function normalizeTrafficSplit(split: TrafficSplit): Record<string, number> {
  let sum = 0;
  for (const v of Object.values(split)) sum += v;
  if (sum <= 0) return split;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(split)) {
    out[k] = v / sum;
  }
  return out;
}

export const experimentConfigSchema = z
  .object({
    ctaText: z.string().optional(),
    headline: z.string().optional(),
    subhead: z.string().optional(),
    searchButton: z.string().optional(),
    showTrustLine: z.boolean().optional(),
    trustLineText: z.string().optional(),
    reassuranceText: z.string().optional(),
    reassuranceCopy: z.string().optional(),
  })
  .passthrough();

export type ExperimentUiConfig = z.infer<typeof experimentConfigSchema>;

export function parseVariantConfig(raw: unknown): ExperimentUiConfig {
  const parsed = experimentConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

const EVENT_NAME_SET = new Set<string>(EXPERIMENT_EVENT_NAMES);

export const trackBodySchema = z.object({
  experimentId: z.string().uuid(),
  variantId: z.string().uuid(),
  eventName: z.string().refine((n) => EVENT_NAME_SET.has(n), "invalid experiment event name"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
