import { trackEvent } from "@/src/services/analytics";

/**
 * Broker-facing listing assistant metrics — safe metadata only (no raw listing body).
 */
export async function recordListingAssistantGeneration(opts: {
  userId: string | null;
  listingId?: string | null;
  language: string;
  listingScore: number;
  complianceRisk: string;
}): Promise<void> {
  console.log("[listing-assistant]", "analytics_generation", {
    listingId: opts.listingId ?? null,
    language: opts.language,
    listingScore: opts.listingScore,
    complianceRisk: opts.complianceRisk,
  });

  await trackEvent(
    "listing_assistant_generate",
    {
      listingId: opts.listingId ?? undefined,
      language: opts.language,
      listingScore: opts.listingScore,
      complianceRisk: opts.complianceRisk,
      conversionProxy: opts.listingScore >= 75 ? "high_score_band" : "below_75",
    },
    { userId: opts.userId },
  );
}
