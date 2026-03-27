import { z } from "zod";

const num = (v: string | undefined, fallback: number) => {
  const n = v != null && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const phase8PlatformConfigSchema = z.object({
  billing: z.object({
    defaultTrialDays: z.number().int().min(0),
    providerName: z.string(),
  }),
  rateLimit: z.object({
    defaultPerMinute: z.number().int().min(1),
    windowSeconds: z.number().int().min(1),
  }),
  audit: z.object({
    exportVersion: z.string(),
  }),
  recertification: z.object({
    defaultListingIntervalDays: z.number().int().min(1),
  }),
  safeLabels: z.object({
    subscriptionRequired: z.string(),
  }),
});

export type Phase8PlatformConfig = z.infer<typeof phase8PlatformConfigSchema>;

export function getPhase8PlatformConfig(): Phase8PlatformConfig {
  const raw: Phase8PlatformConfig = {
    billing: {
      defaultTrialDays: Math.max(0, Math.floor(num(process.env.TRUSTGRAPH_BILLING_TRIAL_DAYS, 14))),
      providerName: process.env.TRUSTGRAPH_BILLING_PROVIDER_NAME?.trim() || "abstract_provider",
    },
    rateLimit: {
      defaultPerMinute: Math.max(1, Math.floor(num(process.env.TRUSTGRAPH_EXTERNAL_API_RPM, 60))),
      windowSeconds: Math.max(1, Math.floor(num(process.env.TRUSTGRAPH_RATE_LIMIT_WINDOW_SEC, 60))),
    },
    audit: {
      exportVersion: process.env.TRUSTGRAPH_AUDIT_EXPORT_VERSION?.trim() || "tg-audit-1",
    },
    recertification: {
      defaultListingIntervalDays: Math.max(1, Math.floor(num(process.env.TRUSTGRAPH_RECERT_LISTING_DAYS, 180))),
    },
    safeLabels: {
      subscriptionRequired: "Subscription required for this TrustGraph feature",
    },
  };
  return phase8PlatformConfigSchema.parse(raw);
}
