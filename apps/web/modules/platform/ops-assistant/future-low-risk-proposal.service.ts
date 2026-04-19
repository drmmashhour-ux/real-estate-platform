/**
 * Low-risk action proposal template — drafts, explicit submit, optional review, registry handoff only.
 * No execution, allowlist, or rollout side effects.
 */

import { randomUUID } from "crypto";

import { upsertFutureReviewCandidateFromAcceptedProposal } from "./future-review-candidate.service";
import type {
  FutureLowRiskActionProposal,
  FutureLowRiskActionProposalReviewChecklist,
  FutureLowRiskActionProposalRiskProfile,
  FutureLowRiskActionProposalStatus,
} from "./future-low-risk-proposal.types";
import {
  recordLowRiskProposalArchived,
  recordLowRiskProposalCreated,
  recordLowRiskProposalAcceptedToRegistry,
  recordLowRiskProposalRejected,
  recordLowRiskProposalSubmitted,
} from "./future-low-risk-proposal-monitoring.service";
import { getProposalRow, listProposalRows, upsertProposalRow } from "./future-low-risk-proposal.store";
import type { FutureReviewCandidateCategory } from "./future-review-candidate.types";

export const CHECKLIST_KEYS = [
  "internalOnlyConfirmed",
  "reversibleConfirmed",
  "noPaymentImpact",
  "noBookingCoreImpact",
  "noAdsCoreImpact",
  "noCroCoreImpact",
  "noExternalSendImpact",
  "noLivePricingImpact",
  "adjacentToCurrentLowRiskScope",
  "clearRollbackExists",
  "clearAuditabilityExists",
] as const satisfies ReadonlyArray<keyof FutureLowRiskActionProposalReviewChecklist>;

export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

export const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  internalOnlyConfirmed: "Internal-only confirmed",
  reversibleConfirmed: "Reversible confirmed",
  noPaymentImpact: "No payment impact",
  noBookingCoreImpact: "No booking-core impact",
  noAdsCoreImpact: "No ads-core impact",
  noCroCoreImpact: "No CRO-core impact",
  noExternalSendImpact: "No external-send impact",
  noLivePricingImpact: "No live pricing impact",
  adjacentToCurrentLowRiskScope: "Adjacent to current low-risk scope",
  clearRollbackExists: "Clear rollback exists",
  clearAuditabilityExists: "Clear auditability exists",
};

export function emptyChecklist(): FutureLowRiskActionProposalReviewChecklist {
  return {
    internalOnlyConfirmed: false,
    reversibleConfirmed: false,
    noPaymentImpact: false,
    noBookingCoreImpact: false,
    noAdsCoreImpact: false,
    noCroCoreImpact: false,
    noExternalSendImpact: false,
    noLivePricingImpact: false,
    adjacentToCurrentLowRiskScope: false,
    clearRollbackExists: false,
    clearAuditabilityExists: false,
  };
}

export function isChecklistComplete(c: FutureLowRiskActionProposalReviewChecklist): boolean {
  return CHECKLIST_KEYS.every((k) => c[k] === true);
}

export function checklistFailures(c: FutureLowRiskActionProposalReviewChecklist): ChecklistKey[] {
  return CHECKLIST_KEYS.filter((k) => !c[k]);
}

function defaultRiskProfile(): FutureLowRiskActionProposalRiskProfile {
  return { headline: "" };
}

export function createProposal(args: {
  title: string;
  proposedActionType: string;
  category: FutureReviewCandidateCategory;
  description?: string;
  createdByNote?: string;
}): { ok: true; id: string } | { ok: false; error: string } {
  const title = args.title.trim();
  const proposedActionType = args.proposedActionType.trim();
  if (!title || !proposedActionType) {
    return { ok: false, error: "title and proposedActionType are required." };
  }

  const now = new Date().toISOString();
  const id = `flrp_${randomUUID()}`;
  const p: FutureLowRiskActionProposal = {
    id,
    title,
    proposedActionType,
    category: args.category,
    description: args.description?.trim() ?? "",
    whyAdjacentToExistingLowRiskScope: "",
    whyReversible: "",
    whyInternalOnly: "",
    expectedOperatorBenefit: "",
    expectedSafetyProfile: "",
    explicitNonGoals: "",
    requiredEvidenceBeforeConsideration: "",
    proposedRollbackMethod: "",
    riskProfile: defaultRiskProfile(),
    reviewChecklist: emptyChecklist(),
    currentStatus: "draft",
    createdAt: now,
    updatedAt: now,
    notes: args.createdByNote?.trim() || undefined,
  };
  upsertProposalRow(p);
  recordLowRiskProposalCreated();
  return { ok: true, id };
}

export type ListProposalsFilter = {
  statuses?: FutureLowRiskActionProposalStatus[];
  includeArchived?: boolean;
};

export function listProposals(filter?: ListProposalsFilter): FutureLowRiskActionProposal[] {
  let rows = listProposalRows();
  if (!filter?.includeArchived) {
    rows = rows.filter((r) => r.currentStatus !== "archived");
  }
  if (filter?.statuses?.length) {
    const set = new Set(filter.statuses);
    rows = rows.filter((r) => set.has(r.currentStatus));
  }
  return rows;
}

export function getProposal(id: string): FutureLowRiskActionProposal | undefined {
  return getProposalRow(id);
}

export type ProposalUpdatePatch = Partial<
  Pick<
    FutureLowRiskActionProposal,
    | "title"
    | "proposedActionType"
    | "category"
    | "description"
    | "whyAdjacentToExistingLowRiskScope"
    | "whyReversible"
    | "whyInternalOnly"
    | "expectedOperatorBenefit"
    | "expectedSafetyProfile"
    | "explicitNonGoals"
    | "requiredEvidenceBeforeConsideration"
    | "proposedRollbackMethod"
    | "riskProfile"
    | "reviewChecklist"
    | "notes"
  >
>;

export function updateProposal(args: {
  id: string;
  patch: ProposalUpdatePatch;
}): { ok: true } | { ok: false; error: string } {
  const cur = getProposalRow(args.id);
  if (!cur) return { ok: false, error: "Unknown proposal." };
  if (cur.currentStatus !== "draft") {
    return { ok: false, error: "Only draft proposals can be edited in full." };
  }

  const now = new Date().toISOString();
  const next: FutureLowRiskActionProposal = {
    ...cur,
    ...args.patch,
    riskProfile: args.patch.riskProfile
      ? { ...cur.riskProfile, ...args.patch.riskProfile }
      : cur.riskProfile,
    reviewChecklist: args.patch.reviewChecklist
      ? { ...cur.reviewChecklist, ...args.patch.reviewChecklist }
      : cur.reviewChecklist,
    updatedAt: now,
  };
  upsertProposalRow(next);
  return { ok: true };
}

const REQUIRED_TEXT_FIELDS: (keyof FutureLowRiskActionProposal)[] = [
  "title",
  "proposedActionType",
  "description",
  "whyAdjacentToExistingLowRiskScope",
  "whyReversible",
  "whyInternalOnly",
  "expectedOperatorBenefit",
  "expectedSafetyProfile",
  "explicitNonGoals",
  "requiredEvidenceBeforeConsideration",
  "proposedRollbackMethod",
];

function proposalContentReady(p: FutureLowRiskActionProposal): boolean {
  for (const k of REQUIRED_TEXT_FIELDS) {
    const v = p[k];
    if (typeof v !== "string" || !v.trim()) return false;
  }
  if (!p.riskProfile.headline.trim()) return false;
  return true;
}

export function submitProposal(id: string): { ok: true } | { ok: false; error: string } {
  const cur = getProposalRow(id);
  if (!cur) return { ok: false, error: "Unknown proposal." };
  if (cur.currentStatus !== "draft") {
    return { ok: false, error: "Only drafts can be submitted." };
  }
  if (!isChecklistComplete(cur.reviewChecklist)) {
    return {
      ok: false,
      error: `Checklist incomplete — failed: ${checklistFailures(cur.reviewChecklist)
        .map((k) => CHECKLIST_LABELS[k])
        .join("; ")}`,
    };
  }
  if (!proposalContentReady(cur)) {
    return { ok: false, error: "Fill all template fields and risk headline before submitting." };
  }

  const now = new Date().toISOString();
  upsertProposalRow({
    ...cur,
    currentStatus: "submitted",
    updatedAt: now,
  });
  recordLowRiskProposalSubmitted();
  return { ok: true };
}

function canTransitionProposal(
  from: FutureLowRiskActionProposalStatus,
  to: FutureLowRiskActionProposalStatus,
): boolean {
  if (from === "archived") return false;
  if (from === to) return true;
  const graph: Record<FutureLowRiskActionProposalStatus, FutureLowRiskActionProposalStatus[]> = {
    draft: ["submitted", "rejected", "archived"],
    submitted: ["under_review", "accepted_to_registry", "rejected", "archived"],
    under_review: ["accepted_to_registry", "rejected", "archived"],
    accepted_to_registry: ["archived"],
    rejected: ["archived"],
    archived: [],
  };
  return graph[from]?.includes(to) ?? false;
}

export function beginProposalReview(id: string): { ok: true } | { ok: false; error: string } {
  const cur = getProposalRow(id);
  if (!cur) return { ok: false, error: "Unknown proposal." };
  if (!canTransitionProposal(cur.currentStatus, "under_review")) {
    return { ok: false, error: `Cannot move ${cur.currentStatus} → under_review.` };
  }
  upsertProposalRow({
    ...cur,
    currentStatus: "under_review",
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export function acceptProposalToRegistry(id: string): { ok: true } | { ok: false; error: string } {
  const cur = getProposalRow(id);
  if (!cur) return { ok: false, error: "Unknown proposal." };
  if (!canTransitionProposal(cur.currentStatus, "accepted_to_registry")) {
    return { ok: false, error: `Cannot accept from status ${cur.currentStatus}.` };
  }

  upsertFutureReviewCandidateFromAcceptedProposal({ proposal: cur });

  upsertProposalRow({
    ...cur,
    currentStatus: "accepted_to_registry",
    updatedAt: new Date().toISOString(),
    notes: mergeNoteLine(cur.notes, `${new Date().toISOString()}: Accepted to future-review registry only — not enabled.`),
  });
  recordLowRiskProposalAcceptedToRegistry();
  return { ok: true };
}

export function rejectProposal(args: {
  id: string;
  reason?: string;
}): { ok: true } | { ok: false; error: string } {
  const cur = getProposalRow(args.id);
  if (!cur) return { ok: false, error: "Unknown proposal." };
  if (!canTransitionProposal(cur.currentStatus, "rejected")) {
    return { ok: false, error: `Cannot reject from status ${cur.currentStatus}.` };
  }
  const now = new Date().toISOString();
  upsertProposalRow({
    ...cur,
    currentStatus: "rejected",
    updatedAt: now,
    notes: args.reason?.trim() ? mergeNoteLine(cur.notes, `${now}: Rejected — ${args.reason.trim()}`) : cur.notes,
  });
  recordLowRiskProposalRejected();
  return { ok: true };
}

export function archiveProposal(args: {
  id: string;
  operatorNote?: string;
}): { ok: true } | { ok: false; error: string } {
  const cur = getProposalRow(args.id);
  if (!cur) return { ok: false, error: "Unknown proposal." };
  if (!canTransitionProposal(cur.currentStatus, "archived")) {
    return { ok: false, error: `Cannot archive from status ${cur.currentStatus}.` };
  }
  const now = new Date().toISOString();
  upsertProposalRow({
    ...cur,
    currentStatus: "archived",
    updatedAt: now,
    notes: args.operatorNote?.trim() ? mergeNoteLine(cur.notes, `${now}: Archived — ${args.operatorNote.trim()}`) : cur.notes,
  });
  recordLowRiskProposalArchived();
  return { ok: true };
}

function mergeNoteLine(prev: string | undefined, line: string): string {
  const base = prev?.trim() ?? "";
  if (!base) return line;
  return `${base}\n${line}`;
}

export { resetFutureLowRiskProposalStoreForTests } from "./future-low-risk-proposal.store";
