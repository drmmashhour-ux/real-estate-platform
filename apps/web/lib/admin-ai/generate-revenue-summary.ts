import {
  AdminAiEntityType,
  AdminAiInsightPriority,
  AdminAiInsightType,
} from "@prisma/client";
import { polishAdminCopy } from "./llm-helpers";
import type { AdminAiInsightPayload, PlatformSignals } from "./types";

function fmtMoney(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function generateRevenueSummary(
  signals: PlatformSignals,
  runId: string
): Promise<AdminAiInsightPayload[]> {
  const delta = signals.revenue.totalCents7d - signals.revenue.totalCentsPrev7d;
  const pct =
    signals.revenue.totalCentsPrev7d > 0
      ? Math.round((delta / signals.revenue.totalCentsPrev7d) * 100)
      : null;

  const facts = {
    total7d: signals.revenue.totalCents7d,
    totalPrev7d: signals.revenue.totalCentsPrev7d,
    delta,
    pct,
    byType: signals.revenue.byPaymentType7d.slice(0, 12),
    bnhubBookingCents7d: signals.revenue.bnhubBookingCents7d,
    listingFeesCents7d: signals.revenue.listingFeesCents7d,
    brokerLeadFeesCents7d: signals.revenue.brokerLeadFeesCents7d,
    featuredCents7d: signals.revenue.featuredOrPromotionCents7d,
    topListings: signals.revenue.topListingEarners.slice(0, 5),
  };

  const fallback = [
    `**Revenue (paid platform payments, 7d)**`,
    `- Total: ${fmtMoney(signals.revenue.totalCents7d)} (prior 7d: ${fmtMoney(signals.revenue.totalCentsPrev7d)})`,
    delta >= 0
      ? `- Change: +${fmtMoney(delta)}${pct !== null ? ` (${pct}% vs prior)` : ""}`
      : `- Change: ${fmtMoney(delta)}${pct !== null ? ` (${pct}% vs prior)` : ""}`,
    `- Heuristic buckets (from payment_type labels): BNHub/stays ~ ${fmtMoney(signals.revenue.bnhubBookingCents7d)}, listing fees ~ ${fmtMoney(signals.revenue.listingFeesCents7d)}, lead/unlock ~ ${fmtMoney(signals.revenue.brokerLeadFeesCents7d)}, featured/promo ~ ${fmtMoney(signals.revenue.featuredOrPromotionCents7d)}`,
    ``,
    `**Largest payment_type lines**`,
    ...signals.revenue.byPaymentType7d.slice(0, 6).map(
      (r) => `- ${r.paymentType}: ${fmtMoney(r.cents)}`
    ),
    ``,
    `**Top listing-attributed revenue**`,
    ...signals.revenue.topListingEarners
      .slice(0, 5)
      .map((t) => `- ${t.kind} ${t.label}: ${fmtMoney(t.cents)}`),
  ].join("\n");

  const body = await polishAdminCopy({
    task: "Summarize revenue performance and opportunities using only FACTS_JSON. Call out underperforming lines only when amounts are present.",
    factsJson: JSON.stringify(facts),
    fallbackText: fallback,
  });

  return [
    {
      type: AdminAiInsightType.revenue_summary,
      title: "Revenue summary (7d)",
      body,
      priority: AdminAiInsightPriority.medium,
      entityType: AdminAiEntityType.revenue,
      metadataJson: { runId, facts, href: "/admin/revenue" },
    },
  ];
}
