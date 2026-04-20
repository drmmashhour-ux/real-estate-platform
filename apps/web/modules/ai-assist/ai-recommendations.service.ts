import type { AiAssistBundle, AiAssistBundleId, AiAssistResult } from "./ai-assist.types";
import { buildAdminDailyAiSummary } from "./admin-daily-summary.service";
import { getInvestorOpportunitySummary } from "./investor-opportunity-summary.service";
import { getListingQualitySuggestionsForHost } from "./listing-quality-suggestions.service";
import { rankBrokerLeadsForBroker } from "./broker-lead-priority.service";
import { getHostRevenueSuggestions } from "./host-revenue-suggestions.service";

/**
 * Bundles v1 safe recommendations. All sub-calls are no-throw; this composes them.
 */
export async function buildAiRecommendationBundle(
  bundleId: AiAssistBundleId,
  params: { hostUserId?: string; brokerUserId?: string }
): Promise<AiAssistResult<AiAssistBundle>> {
  const generatedAt = new Date().toISOString();

  try {
    switch (bundleId) {
      case "listing_quality": {
        if (!params.hostUserId) {
          return { ok: false, error: "hostUserId required", code: "MISSING_HOST" };
        }
        const r = await getListingQualitySuggestionsForHost(params.hostUserId);
        if (!r.ok) return r;
        return {
          ok: true,
          value: { bundleId, generatedAt, items: r.value.items },
        };
      }
      case "broker_leads": {
        const r = await rankBrokerLeadsForBroker(params.brokerUserId);
        if (!r.ok) return r;
        return {
          ok: true,
          value: { bundleId, generatedAt, items: r.value.items },
        };
      }
      case "investor_opportunities": {
        const r = await getInvestorOpportunitySummary();
        if (!r.ok) return r;
        return {
          ok: true,
          value: { bundleId, generatedAt, items: r.value.items },
        };
      }
      case "admin_daily_summary": {
        const r = await buildAdminDailyAiSummary();
        if (!r.ok) return r;
        return {
          ok: true,
          value: { bundleId, generatedAt, items: r.value.items },
        };
      }
      case "host_revenue": {
        if (!params.hostUserId) {
          return { ok: false, error: "hostUserId required", code: "MISSING_HOST" };
        }
        const r = await getHostRevenueSuggestions(params.hostUserId);
        if (!r.ok) return r;
        return {
          ok: true,
          value: { bundleId, generatedAt, items: r.value.items },
        };
      }
      default:
        return { ok: false, error: "Unknown bundle", code: "UNKNOWN_BUNDLE" };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "bundle failed",
      code: "AI_BUNDLE",
    };
  }
}
