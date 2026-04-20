/**
 * Explicit human reviews — advisory labels only; never removes live policy findings.
 */

import { randomBytes } from "node:crypto";

import { buildGrowthPolicyEvaluationContextFromPlatform } from "@/modules/growth/policy/growth-policy-context.service";
import { buildGrowthPolicyFingerprint } from "@/modules/growth/policy/growth-policy-fingerprint.service";
import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyReviewDecision,
  GrowthPolicyReviewRecord,
} from "@/modules/growth/policy/growth-policy-history.types";
import type { GrowthPolicyDomain } from "@/modules/growth/policy/growth-policy.types";
import { evaluateGrowthPolicies } from "@/modules/growth/policy/growth-policy.service";
import { appendReviewRecord, getHistoryDocSnapshot, setHistoryEntry } from "@/modules/growth/policy/growth-policy-history.store";
import { deriveGrowthPolicyHistoryStatus } from "@/modules/growth/policy/growth-policy-recurrence.service";
import { logGrowthPolicyReviewCreated } from "@/modules/growth/policy/growth-policy-history-monitoring.service";

function nowIso(): string {
  return new Date().toISOString();
}

function pickLatestReview(reviews: GrowthPolicyReviewRecord[], fingerprint: string): GrowthPolicyReviewRecord | undefined {
  const rs = reviews.filter((r) => r.fingerprint === fingerprint);
  if (rs.length === 0) return undefined;
  return [...rs].sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0];
}

export function getLatestGrowthPolicyReview(fingerprint: string): GrowthPolicyReviewRecord | undefined {
  const doc = getHistoryDocSnapshot();
  return pickLatestReview(doc.reviews, fingerprint);
}

export function listGrowthPolicyReviews(fingerprint?: string): GrowthPolicyReviewRecord[] {
  const doc = getHistoryDocSnapshot();
  const list = fingerprint ? doc.reviews.filter((r) => r.fingerprint === fingerprint) : [...doc.reviews];
  return list.sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));
}

export type AddGrowthPolicyReviewInput = {
  fingerprint: string;
  policyId: string;
  domain: GrowthPolicyDomain;
  title: string;
  severity: GrowthPolicyHistoryEntry["severity"];
  reviewedBy?: string;
  reviewDecision: GrowthPolicyReviewDecision;
  note?: string;
};

export async function addGrowthPolicyReview(input: AddGrowthPolicyReviewInput): Promise<GrowthPolicyReviewRecord> {
  const id = `gpr-${nowIso()}-${randomBytes(4).toString("hex")}`;
  const record: GrowthPolicyReviewRecord = {
    id,
    fingerprint: input.fingerprint,
    policyId: input.policyId,
    reviewedAt: nowIso(),
    reviewedBy: input.reviewedBy,
    reviewDecision: input.reviewDecision,
    note: input.note,
  };
  appendReviewRecord(record);

  const context = await buildGrowthPolicyEvaluationContextFromPlatform();
  const policies = evaluateGrowthPolicies(context);
  const activeSet = new Set(policies.map((p) => buildGrowthPolicyFingerprint(p)));
  const activeNow = activeSet.has(input.fingerprint);

  const doc = getHistoryDocSnapshot();
  const latest = pickLatestReview(doc.reviews, input.fingerprint)!;
  let entry = doc.entries[input.fingerprint];

  if (!entry) {
    const t = nowIso();
    const seenCount = activeNow ? 1 : 0;
    entry = {
      id: input.fingerprint,
      fingerprint: input.fingerprint,
      policyId: input.policyId,
      domain: input.domain,
      severity: input.severity,
      title: input.title,
      firstSeenAt: t,
      lastSeenAt: t,
      seenCount,
      currentStatus: deriveGrowthPolicyHistoryStatus({
        activeNow,
        seenCount,
        priorStatus: undefined,
        latestReviewDecision: latest.reviewDecision,
      }),
      lastNote: input.note,
      lastReviewedAt: latest.reviewedAt,
      lastReviewedBy: input.reviewedBy,
    };
  } else {
    entry = {
      ...entry,
      lastNote: input.note ?? entry.lastNote,
      lastReviewedAt: latest.reviewedAt,
      lastReviewedBy: input.reviewedBy ?? entry.lastReviewedBy,
      currentStatus: deriveGrowthPolicyHistoryStatus({
        activeNow,
        seenCount: entry.seenCount,
        priorStatus: entry.currentStatus,
        latestReviewDecision: latest.reviewDecision,
      }),
    };
  }

  setHistoryEntry(entry);

  try {
    logGrowthPolicyReviewCreated({ fingerprint: input.fingerprint, decision: input.reviewDecision });
  } catch {
    /* ignore */
  }

  return record;
}
