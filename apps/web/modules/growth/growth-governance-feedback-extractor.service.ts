/**
 * Extracts governance/policy/enforcement feedback candidates — read-only, deterministic.
 */

import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthGovernancePolicySnapshot } from "./growth-governance-policy.types";
import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";
import type {
  GrowthGovernanceConstraintCategory,
  GrowthGovernanceFeedbackEntry,
  GrowthGovernanceFeedbackEntrySource,
  GrowthGovernanceUsefulnessSignal,
} from "./growth-governance-feedback.types";

export type GrowthGovernanceFeedbackExtractInput = {
  governance: GrowthGovernanceDecision | null;
  policySnapshot: GrowthGovernancePolicySnapshot | null;
  enforcementSnapshot: GrowthPolicyEnforcementSnapshot | null;
  learningControl: GrowthLearningControlDecision | null;
  missionHumanReviewQueueLength: number;
  decisionJournalReflections?: string[];
  observedAt: string;
};

function entryId(source: GrowthGovernanceFeedbackEntrySource, key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_|.-]+/g, "_").slice(0, 120);
  return `gfb-${source}-${safe}`;
}

function mapPolicyModeToCategory(
  mode: import("./growth-governance-policy.types").GrowthPolicyMode,
): GrowthGovernanceConstraintCategory | null {
  if (mode === "frozen") return "freeze";
  if (mode === "blocked") return "block";
  if (mode === "approval_required") return "approval_required";
  if (mode === "advisory_only") return "advisory_only";
  return null;
}

function defaultUsefulness(
  category: GrowthGovernanceConstraintCategory,
  hasWeakEvidence: boolean,
): GrowthGovernanceUsefulnessSignal {
  if (hasWeakEvidence) return "insufficient_data";
  if (category === "freeze" || category === "block") return "unclear";
  return "unclear";
}

/**
 * Produces raw feedback entries (may include duplicates — consolidated later).
 */
export function extractGrowthGovernanceFeedbackEntries(input: GrowthGovernanceFeedbackExtractInput): GrowthGovernanceFeedbackEntry[] {
  const out: GrowthGovernanceFeedbackEntry[] = [];
  const { observedAt } = input;
  const weakEvidence =
    (input.governance?.notes.some((n) => n.toLowerCase().includes("weak")) ?? false) ||
    input.missionHumanReviewQueueLength >= 4;

  const gov = input.governance;
  if (gov) {
    if (gov.status === "freeze_recommended") {
      out.push({
        id: entryId("governance", "status-freeze_recommended"),
        category: "freeze",
        target: "governance_status",
        title: "Governance recommends operational freeze review",
        rationale: `Status ${gov.status} — align automation with governance before expanding scope.`,
        recurrenceCount: 1,
        usefulnessSignal: weakEvidence ? "useful" : "unclear",
        source: "governance",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    if (gov.status === "human_review_required") {
      out.push({
        id: entryId("governance", "status-human_review"),
        category: "review_required",
        target: "governance_status",
        title: "Human review required by governance",
        rationale: "Escalation suggests operator review before scaling advisory automation.",
        recurrenceCount: Math.min(5, Math.max(1, gov.humanReviewQueue.length || 1)),
        usefulnessSignal: "unclear",
        source: "governance",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const d of gov.frozenDomains) {
      out.push({
        id: entryId("governance", `frozen-${d}`),
        category: "freeze",
        target: d,
        title: `Frozen domain signal: ${d}`,
        rationale: "Governance lists this domain in frozen set — repeated pattern worth tracking.",
        recurrenceCount: 1,
        usefulnessSignal: defaultUsefulness("freeze", weakEvidence),
        source: "governance",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const d of gov.blockedDomains) {
      out.push({
        id: entryId("governance", `blocked-${d}`),
        category: "block",
        target: d,
        title: `Blocked domain signal: ${d}`,
        rationale: "Governance lists this domain in blocked set.",
        recurrenceCount: 1,
        usefulnessSignal: "unclear",
        source: "governance",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
  }

  const pol = input.policySnapshot;
  if (pol) {
    for (const r of pol.rules) {
      const cat = mapPolicyModeToCategory(r.mode);
      if (!cat) continue;
      out.push({
        id: entryId("policy", `${r.domain}-${r.mode}`),
        category: cat,
        target: r.domain,
        title: `Policy mode ${r.mode} on ${r.domain}`,
        rationale: r.rationale || "Policy rule snapshot (advisory visibility).",
        recurrenceCount: 1,
        usefulnessSignal:
          cat === "freeze" && (r.source === "learning_control" || pol.notes.some((n) => n.includes("learning")))
            ? "useful"
            : defaultUsefulness(cat, weakEvidence),
        source: "policy",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const d of pol.frozenDomains) {
      out.push({
        id: entryId("policy", `agg-frozen-${d}`),
        category: "freeze",
        target: d,
        title: `Aggregated frozen domain: ${d}`,
        rationale: "Policy snapshot aggregates frozen domains.",
        recurrenceCount: 1,
        usefulnessSignal: "unclear",
        source: "policy",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const d of pol.blockedDomains) {
      out.push({
        id: entryId("policy", `agg-blocked-${d}`),
        category: "block",
        target: d,
        title: `Aggregated blocked domain: ${d}`,
        rationale: "Policy snapshot aggregates blocked domains.",
        recurrenceCount: 1,
        usefulnessSignal: "unclear",
        source: "policy",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const d of pol.reviewRequiredDomains) {
      out.push({
        id: entryId("policy", `review-${d}`),
        category: "review_required",
        target: d,
        title: `Review required domain: ${d}`,
        rationale: "Policy marks this domain for human review.",
        recurrenceCount: 1,
        usefulnessSignal: "unclear",
        source: "policy",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
  }

  const enf = input.enforcementSnapshot;
  if (enf) {
    for (const t of enf.frozenTargets) {
      out.push({
        id: entryId("enforcement", `frozen-${t}`),
        category: "freeze",
        target: t,
        title: `Enforcement freeze target: ${t}`,
        rationale: "Enforcement snapshot lists this target as frozen.",
        recurrenceCount: 1,
        usefulnessSignal: "unclear",
        source: "enforcement",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const t of enf.blockedTargets) {
      out.push({
        id: entryId("enforcement", `blocked-${t}`),
        category: "block",
        target: t,
        title: `Enforcement blocked target: ${t}`,
        rationale: "Enforcement snapshot lists this target as blocked.",
        recurrenceCount: 1,
        usefulnessSignal: "unclear",
        source: "enforcement",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
    for (const t of enf.approvalRequiredTargets) {
      out.push({
        id: entryId("enforcement", `approval-${t}`),
        category: "approval_required",
        target: t,
        title: `Approval required target: ${t}`,
        rationale: "Enforcement requires explicit approval for this advisory path.",
        recurrenceCount: 1,
        usefulnessSignal: "useful",
        source: "enforcement",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }

    const stratRule = enf.rules.find((r) => r.target === "strategy_recommendation_promotion");
    const simRule = enf.rules.find((r) => r.target === "simulation_recommendation_promotion");
    const govHealthy = gov?.status === "healthy" || gov?.status === "watch";
    if (
      govHealthy &&
      stratRule &&
      simRule &&
      (stratRule.mode === "advisory_only" || stratRule.mode === "approval_required") &&
      (simRule.mode === "advisory_only" || simRule.mode === "approval_required") &&
      !weakEvidence
    ) {
      out.push({
        id: entryId("enforcement", "promotion-gating-healthy"),
        category: "advisory_only",
        target: "strategy_simulation_promotion",
        title: "Promotion gating while governance is calm",
        rationale:
          "Strategy and simulation promotion are gated though governance status is not elevated — flag for human review only (not an auto-relaxation).",
        recurrenceCount: 2,
        usefulnessSignal: "too_conservative",
        source: "enforcement",
        createdAt: observedAt,
        lastSeenAt: observedAt,
      });
    }
  }

  const lc = input.learningControl;
  if (lc?.state === "freeze_recommended") {
    out.push({
      id: entryId("policy", "learning-freeze"),
      category: "freeze",
      target: "learning_adjustments",
      title: "Learning control recommends freeze",
      rationale: "Adaptive weights should pause — recurring pattern often prevents low-confidence drift.",
      recurrenceCount: 2,
      usefulnessSignal: weakEvidence ? "useful" : "insufficient_data",
      source: "policy",
      createdAt: observedAt,
      lastSeenAt: observedAt,
    });
  }

  if (input.missionHumanReviewQueueLength >= 3) {
    out.push({
      id: entryId("governance", "mission-review-depth"),
      category: "review_required",
      target: "mission_control_queue",
      title: "Mission control human review queue depth",
      rationale: `Human review queue has ${input.missionHumanReviewQueueLength} items — operator process load signal.`,
      recurrenceCount: Math.min(5, input.missionHumanReviewQueueLength),
      usefulnessSignal: "unclear",
      source: "governance",
      createdAt: observedAt,
      lastSeenAt: observedAt,
    });
  }

  for (const line of input.decisionJournalReflections ?? []) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    out.push({
      id: entryId("manual", trimmed.slice(0, 40)),
      category: "review_required",
      target: "decision_journal",
      title: "Decision journal reflection",
      rationale: trimmed.slice(0, 500),
      recurrenceCount: 1,
      usefulnessSignal: "insufficient_data",
      source: "manual",
      createdAt: observedAt,
      lastSeenAt: observedAt,
    });
  }

  return out;
}
