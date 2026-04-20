/**
 * Aggregates evaluation ticks into persistent history rows (additive, bounded work per request).
 */

import { buildGrowthPolicyFingerprint } from "@/modules/growth/policy/growth-policy-fingerprint.service";
import { getLatestGrowthPolicyReview } from "@/modules/growth/policy/growth-policy-review.service";
import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyHistoryHint,
  GrowthPolicyHistorySummary,
} from "@/modules/growth/policy/growth-policy-history.types";
import type { GrowthPolicyResult } from "@/modules/growth/policy/growth-policy.types";
import {
  logGrowthPolicyHistorySummaryBuilt,
  logGrowthPolicyHistoryUpdate,
  logGrowthPolicyRecurringDetected,
} from "@/modules/growth/policy/growth-policy-history-monitoring.service";
import { deriveGrowthPolicyHistoryStatus } from "@/modules/growth/policy/growth-policy-recurrence.service";
import {
  getHistoryDocSnapshot,
  replaceHistoryEntries,
} from "@/modules/growth/policy/growth-policy-history.store";

function nowIso(): string {
  return new Date().toISOString();
}

/** Record one evaluation snapshot; idempotent merge by fingerprint. */
export function recordPolicyEvaluationHistory(policies: GrowthPolicyResult[]): void {
  const doc = getHistoryDocSnapshot();
  const next: Record<string, GrowthPolicyHistoryEntry> = { ...doc.entries };
  const now = nowIso();
  const activeFps = new Set<string>();
  const recurringLogged = new Set<string>();

  for (const p of policies) {
    const fp = buildGrowthPolicyFingerprint(p);
    activeFps.add(fp);
    const old = next[fp];
    const priorStatus = old?.currentStatus;
    const seenCount = (old?.seenCount ?? 0) + 1;
    const latest = getLatestGrowthPolicyReview(fp);

    const entry: GrowthPolicyHistoryEntry = {
      id: fp,
      fingerprint: fp,
      policyId: p.id,
      domain: p.domain,
      severity: p.severity,
      title: p.title,
      firstSeenAt: old?.firstSeenAt ?? now,
      lastSeenAt: now,
      seenCount,
      currentStatus: deriveGrowthPolicyHistoryStatus({
        activeNow: true,
        seenCount,
        priorStatus,
        latestReviewDecision: latest?.reviewDecision,
      }),
      lastNote: old?.lastNote,
      lastReviewedAt: old?.lastReviewedAt,
      lastReviewedBy: old?.lastReviewedBy,
    };
    next[fp] = entry;

    if (entry.currentStatus === "recurring" && !recurringLogged.has(fp)) {
      recurringLogged.add(fp);
      try {
        logGrowthPolicyRecurringDetected({ fingerprint: fp, seenCount });
      } catch {
        /* ignore */
      }
    }
  }

  for (const fp of Object.keys(next)) {
    if (activeFps.has(fp)) continue;
    const old = next[fp];
    const latest = getLatestGrowthPolicyReview(fp);
    next[fp] = {
      ...old,
      currentStatus: deriveGrowthPolicyHistoryStatus({
        activeNow: false,
        seenCount: old.seenCount,
        priorStatus: old.currentStatus,
        latestReviewDecision: latest?.reviewDecision,
      }),
    };
  }

  replaceHistoryEntries(next);

  try {
    logGrowthPolicyHistoryUpdate({ fingerprintCount: activeFps.size, ticked: policies.length });
  } catch {
    /* ignore */
  }
}

export function listGrowthPolicyHistory(): GrowthPolicyHistoryEntry[] {
  const doc = getHistoryDocSnapshot();
  return Object.values(doc.entries).sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export function getGrowthPolicyHistoryByFingerprint(fingerprint: string): GrowthPolicyHistoryEntry | undefined {
  const doc = getHistoryDocSnapshot();
  return doc.entries[fingerprint];
}

export function buildGrowthPolicyHistorySummary(): GrowthPolicyHistorySummary {
  const entries = listGrowthPolicyHistory();
  const doc = getHistoryDocSnapshot();
  const reviews = [...doc.reviews].sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));

  const activeRecurringCount = entries.filter((e) => e.currentStatus === "recurring").length;
  const resolvedReviewedCount = entries.filter((e) => e.currentStatus === "resolved_reviewed").length;

  const topRecurringFindings = [...entries]
    .filter((e) => e.currentStatus === "recurring")
    .sort((a, b) => b.seenCount - a.seenCount)
    .slice(0, 8);

  const recentReviews = reviews.slice(0, 12);

  const summary: GrowthPolicyHistorySummary = {
    totalHistoricalFindings: entries.length,
    activeRecurringCount,
    resolvedReviewedCount,
    topRecurringFindings,
    recentReviews,
    generatedAt: nowIso(),
  };

  try {
    logGrowthPolicyHistorySummaryBuilt({
      total: entries.length,
      recurring: activeRecurringCount,
      resolvedReviewed: resolvedReviewedCount,
    });
  } catch {
    /* ignore */
  }

  return summary;
}

/** Map latest history rows onto current policy ids for compact UI badges. */
export function buildGrowthPolicyHistoryHintsForPolicies(
  policies: GrowthPolicyResult[],
): Record<string, GrowthPolicyHistoryHint> {
  const doc = getHistoryDocSnapshot();
  const out: Record<string, GrowthPolicyHistoryHint> = {};
  for (const p of policies) {
    const fp = buildGrowthPolicyFingerprint(p);
    const e = doc.entries[fp];
    if (!e) continue;
    const rv = getLatestGrowthPolicyReview(fp);
    out[p.id] = {
      fingerprint: fp,
      seenCount: e.seenCount,
      currentStatus: e.currentStatus,
      lastReviewDecision: rv?.reviewDecision,
      lastNote: e.lastNote,
    };
  }
  return out;
}
