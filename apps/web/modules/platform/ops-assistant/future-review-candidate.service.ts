/**
 * Future review candidate registry — explicit status changes only; no execution or allowlist coupling.
 */

import type { ApprovalExecutionReviewRecord } from "./approval-execution-review.types";
import type { FutureLowRiskActionProposal } from "./future-low-risk-proposal.types";
import type {
  FutureReviewCandidate,
  FutureReviewCandidateCategory,
  FutureReviewCandidateEvidenceSummary,
  FutureReviewCandidateReversibility,
  FutureReviewCandidateStatus,
} from "./future-review-candidate.types";
import { isApprovalExecutableActionKind } from "./approval-execution.types";
import {
  recordFutureReviewCandidateAdded,
  recordFutureReviewCandidateArchived,
  recordFutureReviewCandidateRejected,
  recordFutureReviewCandidateUpdated,
} from "./future-review-candidate-monitoring.service";
import { getCandidate, listCandidateValues, upsertCandidate } from "./future-review-candidate.store";

export function candidateIdForActionType(actionType: string): string {
  return `frc_${actionType.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function inferCategory(actionType: string): FutureReviewCandidateCategory {
  const t = actionType.toLowerCase();
  if (t.includes("draft")) return "drafting";
  if (t.includes("tag")) return "triage_tagging";
  if (t.includes("reminder")) return "reminders";
  if (t.includes("workflow") || t.includes("priority") || t.includes("followup") || t.includes("task"))
    return "workflow";
  if (t.includes("prefill") || t.includes("config")) return "configuration";
  return "other";
}

function defaultReversibility(actionType: string): FutureReviewCandidateReversibility {
  if (!isApprovalExecutableActionKind(actionType)) return "unknown";
  return "high";
}

function mergeNoteLine(prev: string | undefined, line: string): string {
  const base = prev?.trim() ?? "";
  if (!base) return line;
  if (base.includes(line)) return base;
  return `${base}\n${line}`;
}

/** Internal line so the UI copy is searchable and consistent */
const FUTURE_REVIEW_BACKLOG_DESCRIPTION_LINE =
  "[Review backlog only] Candidate linked from governance (eligible_for_future_review). Not active.";

function canTransition(from: FutureReviewCandidateStatus, to: FutureReviewCandidateStatus): boolean {
  if (from === "archived") return false;
  if (from === to) return true;
  const graph: Record<FutureReviewCandidateStatus, FutureReviewCandidateStatus[]> = {
    proposed: ["eligible_for_review", "held", "rejected", "archived"],
    eligible_for_review: ["held", "rejected", "archived"],
    held: ["eligible_for_review", "rejected", "archived"],
    rejected: ["archived"],
    archived: [],
  };
  return graph[from]?.includes(to) ?? false;
}

export type ListFutureReviewCandidatesFilter = {
  statuses?: FutureReviewCandidateStatus[];
  includeArchived?: boolean;
};

export function listFutureReviewCandidates(filter?: ListFutureReviewCandidatesFilter): FutureReviewCandidate[] {
  let rows = listCandidateValues();
  if (!filter?.includeArchived) {
    rows = rows.filter((r) => r.currentStatus !== "archived");
  }
  if (filter?.statuses?.length) {
    const set = new Set(filter.statuses);
    rows = rows.filter((r) => set.has(r.currentStatus));
  }
  return rows;
}

export function getFutureReviewCandidate(id: string): FutureReviewCandidate | undefined {
  return getCandidate(id);
}

export function addFutureReviewCandidate(args: {
  actionType: string;
  category?: FutureReviewCandidateCategory;
  description: string;
  whyAdjacentLowRisk: string;
  evidenceSummary: FutureReviewCandidateEvidenceSummary;
  auditHealthSummary: string;
  reversibility?: FutureReviewCandidateReversibility;
  notes?: string;
  initialStatus?: FutureReviewCandidateStatus;
}): { ok: true; id: string } | { ok: false; error: string } {
  const at = args.actionType.trim();
  if (!at) return { ok: false, error: "actionType required." };

  const id = candidateIdForActionType(at);
  if (getCandidate(id)) {
    return { ok: false, error: "A candidate for this action type already exists — update it instead." };
  }

  const now = new Date().toISOString();
  const status = args.initialStatus ?? "proposed";
  const c: FutureReviewCandidate = {
    id,
    actionType: at,
    category: args.category ?? inferCategory(at),
    description: args.description.trim(),
    whyAdjacentLowRisk: args.whyAdjacentLowRisk.trim(),
    evidenceSummary: {
      narrative: args.evidenceSummary.narrative.trim(),
      headline: args.evidenceSummary.headline?.trim(),
    },
    auditHealthSummary: args.auditHealthSummary.trim(),
    reversibility: args.reversibility ?? defaultReversibility(at),
    currentStatus: status,
    createdAt: now,
    updatedAt: now,
    notes: args.notes?.trim() || undefined,
  };
  upsertCandidate(c);
  recordFutureReviewCandidateAdded();
  return { ok: true, id };
}

export function upsertFutureReviewCandidateFromGovernanceReview(args: {
  record: ApprovalExecutionReviewRecord;
  reviewerId: string;
}): void {
  const at = args.record.actionType;
  const id = candidateIdForActionType(at);
  const existing = getCandidate(id);
  const now = new Date().toISOString();

  const ev: FutureReviewCandidateEvidenceSummary = {
    headline: `Governance review ${args.record.id}`,
    narrative: [
      `Measured decision context: ${args.record.measuredDecision}`,
      args.record.evidenceSummary.length > 4000
        ? `${args.record.evidenceSummary.slice(0, 4000)}…`
        : args.record.evidenceSummary,
    ].join("\n"),
  };

  const c: FutureReviewCandidate = {
    id,
    actionType: at,
    category: inferCategory(at),
    description: mergeNoteLine(
      existing?.description,
      FUTURE_REVIEW_BACKLOG_DESCRIPTION_LINE,
    ),
    whyAdjacentLowRisk:
      existing?.whyAdjacentLowRisk?.trim() ||
      `Adjacent to current approval-execution surface; allowlist item ${at} marked for future manual scope discussion only.`,
    evidenceSummary: ev,
    auditHealthSummary:
      existing?.auditHealthSummary ||
      `Safety: ${args.record.safetySummary}; usefulness: ${args.record.usefulnessSummary}. Reviewer: ${args.reviewerId}.`,
    reversibility: existing?.reversibility ?? defaultReversibility(at),
    currentStatus: "eligible_for_review",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    notes: mergeNoteLine(
      existing?.notes,
      `Backlog sync: reviewed_future_review on ${args.record.reviewedAt ?? now} (${args.reviewerId}). ${args.record.notes ?? ""}`.trim(),
    ),
  };

  upsertCandidate(c);
  if (existing) {
    recordFutureReviewCandidateUpdated("governance_upsert");
  } else {
    recordFutureReviewCandidateAdded();
  }
}

const PROPOSAL_REGISTRY_HEADLINE = "[Source: accepted proposal — inactive backlog only]";

export function upsertFutureReviewCandidateFromAcceptedProposal(args: {
  proposal: FutureLowRiskActionProposal;
}): void {
  const at = args.proposal.proposedActionType.trim();
  const id = candidateIdForActionType(at);
  const existing = getCandidate(id);
  const now = new Date().toISOString();
  const p = args.proposal;

  const narrative = [
    PROPOSAL_REGISTRY_HEADLINE,
    `Proposal id: ${p.id}`,
    `Title: ${p.title}`,
    `Non-goals: ${p.explicitNonGoals}`,
    `Rollback method: ${p.proposedRollbackMethod}`,
    `Evidence required before consideration: ${p.requiredEvidenceBeforeConsideration}`,
    `Safety profile (author): ${p.expectedSafetyProfile}`,
    `Risk headline: ${p.riskProfile.headline}`,
    p.riskProfile.elaboration ? `Risk detail: ${p.riskProfile.elaboration}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const ev: FutureReviewCandidateEvidenceSummary = {
    headline: `Accepted proposal ${p.id}`,
    narrative,
  };

  const c: FutureReviewCandidate = {
    id,
    actionType: at,
    category: p.category,
    description: mergeNoteLine(existing?.description, `[Proposal ${p.id}] ${p.description}`.trim()),
    whyAdjacentLowRisk:
      mergeNoteLine(existing?.whyAdjacentLowRisk, p.whyAdjacentToExistingLowRiskScope).trim() ||
      p.whyAdjacentToExistingLowRiskScope,
    evidenceSummary: ev,
    auditHealthSummary:
      mergeNoteLine(
        existing?.auditHealthSummary,
        `Proposal acceptance snapshot — operator benefit: ${p.expectedOperatorBenefit.slice(0, 500)}`,
      ).trim() || `Proposal ${p.id} accepted to registry — not executed.`,
    reversibility: existing?.reversibility ?? defaultReversibility(at),
    currentStatus: "proposed",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sourceProposalId: p.id,
    notes: mergeNoteLine(
      existing?.notes,
      `${now}: Linked from proposal ${p.id} (accepted_to_registry). Still inactive.`,
    ),
  };

  upsertCandidate(c);
  if (existing) {
    recordFutureReviewCandidateUpdated("proposal_upsert");
  } else {
    recordFutureReviewCandidateAdded();
  }
}

export function updateFutureReviewCandidateStatus(args: {
  id: string;
  nextStatus: FutureReviewCandidateStatus;
  operatorNote?: string;
}): { ok: true } | { ok: false; error: string } {
  const cur = getCandidate(args.id);
  if (!cur) return { ok: false, error: "Unknown candidate." };
  if (!canTransition(cur.currentStatus, args.nextStatus)) {
    return { ok: false, error: `Invalid transition ${cur.currentStatus} → ${args.nextStatus}.` };
  }

  const now = new Date().toISOString();
  const next: FutureReviewCandidate = {
    ...cur,
    currentStatus: args.nextStatus,
    updatedAt: now,
    notes: args.operatorNote?.trim()
      ? mergeNoteLine(cur.notes, `${now}: ${args.operatorNote.trim()}`)
      : cur.notes,
  };
  upsertCandidate(next);

  if (args.nextStatus === "rejected") {
    recordFutureReviewCandidateRejected();
  } else if (args.nextStatus === "archived") {
    recordFutureReviewCandidateArchived();
  } else {
    recordFutureReviewCandidateUpdated("status_change");
  }
  return { ok: true };
}

export function archiveFutureReviewCandidate(args: {
  id: string;
  operatorNote?: string;
}): { ok: true } | { ok: false; error: string } {
  return updateFutureReviewCandidateStatus({
    id: args.id,
    nextStatus: "archived",
    operatorNote: args.operatorNote,
  });
}

export { resetFutureReviewCandidateStoreForTests } from "./future-review-candidate.store";
