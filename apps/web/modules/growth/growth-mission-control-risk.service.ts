/**
 * Growth Mission Control — risk aggregation (advisory only).
 */

import type { GrowthMissionControlBuildContext } from "./growth-mission-control.types";
import type { GrowthMissionControlRisk } from "./growth-mission-control.types";

const MAX_RISKS = 5;

function normalizeRiskDedupeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function severityRank(s: GrowthMissionControlRisk["severity"]): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function mergeWhy(a: string, b: string): string {
  const x = a.trim();
  const y = b.trim();
  if (!x) return y.slice(0, 180);
  if (!y) return x.slice(0, 180);
  if (normTitle(x) === normTitle(y)) return x.slice(0, 180);
  return `${x.slice(0, 100)} · ${y.slice(0, 70)}`.slice(0, 180);
}

function mapGovSeverity(s: "low" | "medium" | "high"): GrowthMissionControlRisk["severity"] {
  return s;
}

export function buildGrowthMissionRisks(ctx: GrowthMissionControlBuildContext): {
  risks: GrowthMissionControlRisk[];
  dedupeEvents: number;
} {
  const raw: GrowthMissionControlRisk[] = [];

  const gov = ctx.governance;
  if (gov?.status === "human_review_required") {
    raw.push({
      title: "Human review required",
      severity: "high",
      source: "governance",
      why:
        gov.humanReviewItems[0]?.trim()?.slice(0, 180) ||
        gov.topRisks[0]?.reason?.trim()?.slice(0, 180) ||
        "Governance status requires operator review.",
    });
  }
  for (const s of gov?.topRisks ?? []) {
    raw.push({
      title: s.title,
      severity: mapGovSeverity(s.severity),
      source: "governance",
      why: s.reason?.trim()?.slice(0, 180) || s.description?.trim()?.slice(0, 180) || "Governance signal.",
    });
  }

  for (const line of ctx.executive?.topRisks ?? []) {
    const t = line.trim();
    if (!t) continue;
    raw.push({
      title: t,
      severity: "medium",
      source: "executive",
      why: "Listed in executive risk strip.",
    });
  }

  const fusion = ctx.fusion;
  if (fusion?.summary?.status === "weak") {
    raw.push({
      title: "Fusion snapshot is weak",
      severity: "medium",
      source: "fusion",
      why: "Fusion confidence band is weak — validate upstream signals before scaling.",
    });
  }
  for (const p of fusion?.summary?.topProblems ?? []) {
    const t = p.trim();
    if (!t) continue;
    raw.push({
      title: t.slice(0, 120),
      severity: "medium",
      source: "fusion",
      why: "Listed in fusion top problems.",
    });
  }

  if (fusion?.actions?.length) {
    for (const a of fusion.actions) {
      if (a.status !== "rejected") continue;
      raw.push({
        title: a.title,
        severity: "high",
        source: "fusion",
        why: a.why?.trim()?.slice(0, 180) || "Fusion flagged this action.",
      });
    }
  }

  const sim = ctx.simulationBundle;
  for (const scen of sim?.scenarios ?? []) {
    for (const r of scen.risks ?? []) {
      raw.push({
        title: r.title,
        severity: r.severity,
        source: "simulation",
        why: r.rationale?.trim()?.slice(0, 180) || "Identified in autonomous growth simulations.",
      });
    }
  }

  const graph = ctx.graphFocusHint?.trim();
  if (graph) {
    raw.push({
      title: `Graph: ${graph.slice(0, 80)}`,
      severity: "low",
      source: "graph",
      why: "Knowledge graph surfaced this relationship.",
    });
  }

  const journal = ctx.journalFocusHint?.trim();
  if (journal) {
    raw.push({
      title: `Journal: ${journal.slice(0, 80)}`,
      severity: "low",
      source: "journal",
      why: "Decision journal highlight.",
    });
  }

  const byKey = new Map<string, GrowthMissionControlRisk>();
  for (const item of raw) {
    const key = normalizeRiskDedupeKey(item.title);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...item, why: item.why.slice(0, 180) });
      continue;
    }
    const rankItem = severityRank(item.severity);
    const rankPrev = severityRank(prev.severity);
    const winner =
      rankItem > rankPrev ? item : rankPrev > rankItem ? prev : item.title.length >= prev.title.length ? item : prev;
    const loser = winner === item ? prev : item;
    const maxRank = Math.max(rankItem, rankPrev);
    const severityLabel: GrowthMissionControlRisk["severity"] =
      maxRank >= 3 ? "high" : maxRank >= 2 ? "medium" : "low";
    byKey.set(key, {
      ...winner,
      severity: severityLabel,
      source: winner.source === loser.source ? winner.source : `${winner.source}+${loser.source}`,
      why: mergeWhy(winner.why, loser.why),
    });
  }

  const mergedList = Array.from(byKey.values());
  mergedList.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const dedupeEvents = Math.max(0, raw.length - byKey.size);
  return { risks: mergedList.slice(0, MAX_RISKS), dedupeEvents };
}
