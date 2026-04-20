import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import type { AiAssistResult } from "./ai-assist.types";
import type { AiRecommendationItem } from "./ai-assist.types";

/**
 * Host-facing revenue hints from BNHub dashboard aggregates — **never applies pricing** here.
 */
export async function getHostRevenueSuggestions(hostUserId: string): Promise<
  AiAssistResult<{ items: AiRecommendationItem[] }>
> {
  try {
    const dash = await getRevenueDashboardSummary(hostUserId);
    const p = dash.portfolio;

    const occ = Number(p.occupancyRate ?? 0);
    const revpar = Number(p.revpar ?? 0);

    const items: AiRecommendationItem[] = [];

    items.push({
      id: `host:rev:overview`,
      hub: "bnhub_host",
      actionClass: "recommendation",
      title: "Portfolio KPI snapshot",
      body: `Gross revenue ${p.grossRevenue}; occupancy ${occ}; bookings ${p.bookingCount}; RevPAR ${revpar}; ADR ${p.adr}.`,
      reasonCodes: [{ code: "SOURCE_BNHUB_DASHBOARD", message: "getRevenueDashboardSummary" }],
    });

    if (occ < 0.45) {
      items.push({
        id: `host:rev:occ_low`,
        hub: "bnhub_host",
        actionClass: "recommendation",
        title: "Occupancy below typical band",
        body: "Consider reviewing minimum stay, calendar gaps, or promotions — any night-rate change stays manual or autonomy policy-gated.",
        reasonCodes: [
          { code: "THRESHOLD_OCC", message: "occupancyRate < 0.45" },
          { code: "NO_AUTO_PRICE", message: "v1 does not mutate nightPriceCents" },
        ],
      });
    }

    if (revpar > 0 && revpar < 60) {
      items.push({
        id: `host:rev:revpar_low`,
        hub: "bnhub_host",
        actionClass: "recommendation",
        title: "RevPAR opportunity",
        body: "RevPAR is modest versus active listings — validate comps and seasonality before adjusting rates.",
        reasonCodes: [{ code: "THRESHOLD_REVPAR", message: "revpar < 60" }],
      });
    }

    return { ok: true, value: { items } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "host revenue suggestions failed",
      code: "HOST_REVENUE",
    };
  }
}
