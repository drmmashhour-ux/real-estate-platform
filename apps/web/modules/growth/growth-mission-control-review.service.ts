/**
 * Human review queue — advisory merge only; no workflow side effects.
 */

import type { GrowthMissionControlBuildContext } from "./growth-mission-control.types";
import type { GrowthMissionControlReviewItem } from "./growth-mission-control.types";

const MAX = 5;

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 96);
}

function severityRank(s: GrowthMissionControlReviewItem["severity"]): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

function mergeReason(a: string, b: string): string {
  const x = a.trim();
  const y = b.trim();
  if (!x) return y.slice(0, 240);
  if (!y) return x.slice(0, 240);
  if (x === y) return x.slice(0, 240);
  return `${x.slice(0, 140)} · ${y.slice(0, 90)}`.slice(0, 240);
}

export function buildGrowthMissionReviewQueue(ctx: GrowthMissionControlBuildContext): {
  items: GrowthMissionControlReviewItem[];
  dedupeEvents: number;
} {
  const out: GrowthMissionControlReviewItem[] = [];

  for (const item of ctx.governance?.humanReviewQueue ?? []) {
    out.push({
      id: item.id,
      title: item.title,
      source: `governance:${item.category}`,
      reason: item.reason,
      severity: item.severity,
    });
  }

  let i = 0;
  for (const line of ctx.governance?.humanReviewItems ?? []) {
    if (!line?.trim()) continue;
    out.push({
      id: `gov-str-${i++}`,
      title: line.trim(),
      source: "governance",
      reason: "Governance escalation summary",
      severity: "medium",
    });
  }

  let fusionReview = 0;
  for (const a of ctx.fusion?.actions ?? []) {
    if (a.executionMode === "manual_only" && a.impact === "high") {
      out.push({
        id: `fusion-${a.id}`,
        title: a.title,
        source: "fusion",
        reason: a.why.slice(0, 240),
        severity: "high",
      });
      fusionReview += 1;
      if (fusionReview >= 2) break;
    }
  }

  const lc = ctx.learningControl;
  if (lc && (lc.state === "freeze_recommended" || lc.state === "reset_recommended" || lc.state === "monitor")) {
    out.push({
      id: "learning-control",
      title: "Growth learning control review",
      source: "learning_control",
      reason: lc.reasons.map((r) => r.message).join("; ") || `State: ${lc.state}`,
      severity: lc.state === "monitor" ? "medium" : "high",
    });
  }

  const rd = ctx.responseDesk;
  if (rd && rd.itemCount > 0 && rd.urgentCount > 0) {
    out.push({
      id: "response-desk-urgent",
      title: "Response Desk — urgent follow-ups",
      source: "response_desk",
      reason: `${rd.urgentCount} urgent / ${rd.itemCount} total items in queue (advisory).`,
      severity: rd.urgentCount >= 5 ? "high" : "medium",
    });
  }

  for (const p of ctx.coordination?.proposals ?? []) {
    if (p.requiresHumanReview) {
      out.push({
        id: `agent-${p.id}`,
        title: p.title,
        source: `agents:${p.agentId}`,
        reason: p.rationale.slice(0, 200),
        severity: p.impact === "high" ? "high" : "medium",
      });
    }
  }

  const rawLen = out.length;
  const byKey = new Map<string, GrowthMissionControlReviewItem>();
  for (const item of out) {
    const key = normTitle(item.title);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, item);
      continue;
    }
    const rankItem = severityRank(item.severity);
    const rankPrev = severityRank(prev.severity);
    const winner =
      rankItem > rankPrev ? item : rankPrev > rankItem ? prev : item.reason.length >= prev.reason.length ? item : prev;
    const loser = winner === item ? prev : item;
    const maxRank = Math.max(rankItem, rankPrev);
    const sev: GrowthMissionControlReviewItem["severity"] =
      maxRank >= 3 ? "high" : maxRank >= 2 ? "medium" : "low";
    byKey.set(key, {
      ...winner,
      severity: sev,
      source: winner.source === loser.source ? winner.source : `${winner.source}+${loser.source}`,
      reason: mergeReason(winner.reason, loser.reason),
    });
  }

  const merged = Array.from(byKey.values());
  merged.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const dedupeEvents = Math.max(0, rawLen - byKey.size);
  return { items: merged.slice(0, MAX), dedupeEvents };
}
