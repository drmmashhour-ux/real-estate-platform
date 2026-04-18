import { aggregateCompanyMetrics } from "../company-metrics/company-metrics-aggregation.service";
import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import { resolveKpiDateRange } from "../broker-kpis/broker-kpi-aggregation.service";
import { buildOwnerDashboardPayload } from "../owner-dashboard/owner-dashboard.service";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import type { FounderIntelligenceSnapshot, FounderSignal } from "./founder-intelligence.types";
import { getFounderMemoryContext } from "./founder-memory.service";
import { rankFounderPriorities } from "./founder-priority.service";

function num(n: number | null | undefined): number | null {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return n;
}

function compareMetric(
  label: string,
  cur: number | null,
  prev: number | null,
  improvingWhen: "higher" | "lower",
): { bucket: "improving" | "deteriorating" | "neutral"; cur: number | null; prev: number | null } {
  if (cur === null || prev === null) {
    return { bucket: "neutral", cur, prev };
  }
  const delta = cur - prev;
  if (delta === 0) return { bucket: "neutral", cur, prev };
  const better = improvingWhen === "higher" ? delta > 0 : delta < 0;
  return { bucket: better ? "improving" : "deteriorating", cur, prev };
}

function buildPreviousCustomRange(window: CompanyMetricsWindow, custom?: { from: string; to: string }): {
  from: string;
  to: string;
} | null {
  const range = resolveKpiDateRange(window, custom);
  const duration = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { from: prevStart.toISOString(), to: prevEnd.toISOString() };
}

export async function buildFounderIntelligenceSnapshot(
  scope: ExecutiveScope,
  window: CompanyMetricsWindow,
  userId: string,
  custom?: { from: string; to: string },
): Promise<FounderIntelligenceSnapshot> {
  const current = await aggregateCompanyMetrics(scope, window, custom);
  const prevRange = buildPreviousCustomRange(window, custom);
  const previous = prevRange ? await aggregateCompanyMetrics(scope, "custom", prevRange) : null;

  const dashboard = await buildOwnerDashboardPayload(scope, window, custom);
  const memory = await getFounderMemoryContext(userId, scope);

  const improving: FounderIntelligenceSnapshot["improving"] = [];
  const deteriorating: FounderIntelligenceSnapshot["deteriorating"] = [];

  if (previous) {
    const pairs: { label: string; improvingWhen: "higher" | "lower"; cur: number | null; prev: number | null }[] = [
      { label: "closed_deals", improvingWhen: "higher", cur: current.deals.closed, prev: previous.deals.closed },
      { label: "new_leads", improvingWhen: "higher", cur: current.leads.totalLeads, prev: previous.leads.totalLeads },
      {
        label: "qualified_leads",
        improvingWhen: "higher",
        cur: current.leads.qualifiedLeads,
        prev: previous.leads.qualifiedLeads,
      },
      { label: "active_deals", improvingWhen: "higher", cur: current.deals.active, prev: previous.deals.active },
      {
        label: "blocked_requests",
        improvingWhen: "lower",
        cur: current.blockers.blockedDealRequests,
        prev: previous.blockers.blockedDealRequests,
      },
      {
        label: "open_compliance",
        improvingWhen: "lower",
        cur: current.compliance.openCases,
        prev: previous.compliance.openCases,
      },
      {
        label: "overdue_invoices",
        improvingWhen: "lower",
        cur: current.finance.overdueInvoices,
        prev: previous.finance.overdueInvoices,
      },
    ];

    for (const p of pairs) {
      const r = compareMetric(p.label, num(p.cur), num(p.prev), p.improvingWhen);
      if (r.bucket === "improving") {
        improving.push({ metric: p.label, current: r.cur, previous: r.prev });
      } else if (r.bucket === "deteriorating") {
        deteriorating.push({ metric: p.label, current: r.cur, previous: r.prev });
      }
    }
  }

  const priorities = rankFounderPriorities(current, dashboard);

  const whatChanged: string[] = [];
  if (previous) {
    whatChanged.push(
      `Période comparée: ${previous.range.label} (${previous.range.startIso} → ${previous.range.endIso}).`,
    );
    whatChanged.push(
      `Fenêtre courante: ${current.range.label} (${current.range.startIso} → ${current.range.endIso}).`,
    );
  } else {
    whatChanged.push("Aucune période précédente calculée pour comparaison.");
  }

  const decisionNow: string[] = priorities.slice(0, 5).map((p) => p.title);

  const delegateCandidates: string[] = [];
  if (current.velocity.avgResponseTimeHours !== null && current.velocity.responseSampleSize > 0) {
    delegateCandidates.push(
      `Files d’attente / temps de réponse: moyenne ${current.velocity.avgResponseTimeHours} h (échantillon ${current.velocity.responseSampleSize}).`,
    );
  }

  const nextWeekWatchlist: string[] = [
    ...deteriorating.map(
      (d) => `Surveiller ${d.metric}: ${d.previous ?? "n/a"} → ${d.current ?? "n/a"} (comparaison interne).`,
    ),
  ];
  if (memory.recentBriefingIds.length > 0) {
    nextWeekWatchlist.push(`Briefings récents à croiser: ${memory.recentBriefingIds.length} fiche(s).`);
  }

  const signals: FounderSignal[] = [
    { kind: "metrics_delta", label: "Portée", ref: "scope", value: current.scopeLabel },
    {
      kind: "pipeline",
      label: "Dossiers actifs",
      ref: "deals.active",
      value: current.deals.active,
    },
    {
      kind: "compliance",
      label: "Conformité ouverte",
      ref: "compliance.openCases",
      value: current.compliance.openCases,
    },
  ];

  return {
    scope,
    window,
    generatedAt: new Date().toISOString(),
    current,
    previous,
    previousRangeLabel: previous ? previous.range.label : null,
    dashboard,
    signals,
    whatChanged,
    improving,
    deteriorating,
    decisionNow,
    delegateCandidates,
    nextWeekWatchlist: nextWeekWatchlist.slice(0, 8),
  };
}
