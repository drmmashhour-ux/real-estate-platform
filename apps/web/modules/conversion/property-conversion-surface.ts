import type { ListingDemandUiPayload } from "@/lib/listings/listing-analytics-service";
import { getConversionEngineFlagsEffective } from "@/config/rollout";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import type { InstantValueSummary } from "@/modules/conversion/instant-value.types";
import { buildRealUrgencySignals } from "@/modules/conversion/real-urgency.service";

export type PropertyConversionSurface = {
  summary: InstantValueSummary;
  urgencyLines: string[];
};

/**
 * Parses unique 24h view counts from demand UI copy — only when the string matches known formats.
 */
export function recentViews24hFromActivityHint(activityHint: string | null | undefined): number | null {
  if (!activityHint) return null;
  const fsbo = /^(\d+)\s+people viewed/i.exec(activityHint);
  if (fsbo) return Number(fsbo[1]);
  const crm = /(\d+)\+\s*unique views/i.exec(activityHint);
  if (crm) return Number(crm[1]);
  return null;
}

/**
 * Server-only: instant value + optional real urgency for property detail (feature-flagged).
 */
export function buildPropertyConversionSurface(opts: {
  priceCents: number;
  city: string;
  verified: boolean;
  featured: boolean;
  listingUpdatedAt: Date | null;
  demandUi: ListingDemandUiPayload | null;
  /** For rollout partial/internal gating */
  pathname?: string;
  isPrivilegedUser?: boolean;
}): PropertyConversionSurface | null {
  try {
    const flags = getConversionEngineFlagsEffective({
      pathname: opts.pathname,
      isPrivilegedUser: opts.isPrivilegedUser,
    });
    if (!flags.conversionUpgradeV1) return null;

    const summary = buildInstantValueSummary({
      page: "property",
      intent: "buy",
      listing: {
        priceCents: opts.priceCents,
        city: opts.city,
        verified: opts.verified,
        dealType: "sale",
        featured: opts.featured,
      },
    });

    const urgencyLines = flags.realUrgencyV1
      ? buildRealUrgencySignals({
          listingUpdatedAt: opts.listingUpdatedAt ? opts.listingUpdatedAt.toISOString() : undefined,
          highIntentSignal: Boolean(opts.demandUi?.activityHint),
          recentViewCount: recentViews24hFromActivityHint(opts.demandUi?.activityHint ?? null),
        })
      : [];

    return { summary, urgencyLines };
  } catch {
    return null;
  }
}
