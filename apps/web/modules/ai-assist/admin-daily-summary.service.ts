import { getDashboardOverview } from "@/modules/analytics/services/admin-analytics-service";
import type { AiAssistResult } from "./ai-assist.types";
import type { AiRecommendationItem } from "./ai-assist.types";

/**
 * Deterministic admin briefing from **existing** KPI aggregates — no LLM invention.
 */
export async function buildAdminDailyAiSummary(): Promise<AiAssistResult<{ items: AiRecommendationItem[] }>> {
  try {
    const o = await getDashboardOverview();

    const lines: string[] = [
      `Users — total ${o.users.total}; active (30d) ${o.users.active}`,
      `Clients — total ${o.clients.total}`,
      `Deals — active ${o.deals.active}`,
      `Offers — total ${o.offers.total} (submitted ${o.offers.submitted}, under review ${o.offers.underReview}, accepted ${o.offers.accepted})`,
      `Contracts — total ${o.contracts.total}; signed ${o.contracts.signed}; pending ${o.contracts.pending}; completed ${o.contracts.completed}`,
      `Appointments — total ${o.appointments.total}; pending ${o.appointments.pending}; completed ${o.appointments.completed}; upcoming ${o.appointments.upcoming}`,
      `Documents on file — ${o.documents.total}; investment deals — ${o.portfolio.investmentDeals}`,
    ];

    const items: AiRecommendationItem[] = [
      {
        id: "admin:daily:overview",
        hub: "admin",
        actionClass: "recommendation",
        title: "Daily platform snapshot",
        body: lines.join("\n"),
        reasonCodes: [
          { code: "SOURCE_ADMIN_ANALYTICS", message: "getDashboardOverview()" },
          { code: "NO_FORECASTING", message: "Counts are historical aggregates only" },
        ],
      },
    ];

    return { ok: true, value: { items } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "admin summary failed",
      code: "ADMIN_DAILY",
    };
  }
}
