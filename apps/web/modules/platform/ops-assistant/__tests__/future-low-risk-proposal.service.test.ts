import { readFileSync } from "fs";
import { dirname, join } from "path";
import { describe, expect, it, beforeEach } from "vitest";
import { fileURLToPath } from "url";

import {
  candidateIdForActionType,
  getFutureReviewCandidate,
  resetFutureReviewCandidateStoreForTests,
} from "../future-review-candidate.service";
import {
  acceptProposalToRegistry,
  archiveProposal,
  beginProposalReview,
  createProposal,
  emptyChecklist,
  getProposal,
  isChecklistComplete,
  rejectProposal,
  submitProposal,
  updateProposal,
  resetFutureLowRiskProposalStoreForTests,
} from "../future-low-risk-proposal.service";
import {
  resetLowRiskProposalMonitoringForTests,
  getLowRiskProposalMonitoringSnapshot,
} from "../future-low-risk-proposal-monitoring.service";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fillValidDraft(id: string) {
  updateProposal({
    id,
    patch: {
      description: "Summarize internal draft diffs for operators.",
      whyAdjacentToExistingLowRiskScope: "Same artifact types as createInternalDraft.",
      whyReversible: "Draft-only; discard draft id.",
      whyInternalOnly: "No buyer-facing surface.",
      expectedOperatorBenefit: "Faster triage.",
      expectedSafetyProfile: "Low blast radius; draft scope only.",
      explicitNonGoals: "No listing publish, no payments.",
      requiredEvidenceBeforeConsideration: "10 dry-run executions in staging.",
      proposedRollbackMethod: "Feature flag off + draft purge script.",
      riskProfile: { headline: "Low — draft namespace only" },
      reviewChecklist: {
        internalOnlyConfirmed: true,
        reversibleConfirmed: true,
        noPaymentImpact: true,
        noBookingCoreImpact: true,
        noAdsCoreImpact: true,
        noCroCoreImpact: true,
        noExternalSendImpact: true,
        noLivePricingImpact: true,
        adjacentToCurrentLowRiskScope: true,
        clearRollbackExists: true,
        clearAuditabilityExists: true,
      },
    },
  });
}

describe("future-low-risk-proposal.service", () => {
  beforeEach(() => {
    resetFutureLowRiskProposalStoreForTests();
    resetFutureReviewCandidateStoreForTests();
    resetLowRiskProposalMonitoringForTests();
  });

  it("creates draft proposal", () => {
    const r = createProposal({
      title: "Test",
      proposedActionType: "mockSummarizeDraft",
      category: "drafting",
    });
    expect(r.ok).toBe(true);
    const p = getProposal(r.ok ? r.id : "");
    expect(p?.currentStatus).toBe("draft");
    expect(getLowRiskProposalMonitoringSnapshot().created).toBeGreaterThanOrEqual(1);
  });

  it("blocks submit when checklist incomplete", () => {
    const r = createProposal({
      title: "T",
      proposedActionType: "a1",
      category: "other",
    });
    expect(r.ok).toBe(true);
    fillValidDraft(r.id);
    updateProposal({
      id: r.id,
      patch: {
        reviewChecklist: {
          ...emptyChecklist(),
          internalOnlyConfirmed: true,
        },
      },
    });
    const p = getProposal(r.id)!;
    expect(isChecklistComplete(p.reviewChecklist)).toBe(false);
    expect(submitProposal(r.id).ok).toBe(false);
  });

  it("blocks submit when required fields missing", () => {
    const r = createProposal({
      title: "T2",
      proposedActionType: "a2",
      category: "other",
    });
    expect(r.ok).toBe(true);
    updateProposal({
      id: r.id,
      patch: {
        reviewChecklist: {
          internalOnlyConfirmed: true,
          reversibleConfirmed: true,
          noPaymentImpact: true,
          noBookingCoreImpact: true,
          noAdsCoreImpact: true,
          noCroCoreImpact: true,
          noExternalSendImpact: true,
          noLivePricingImpact: true,
          adjacentToCurrentLowRiskScope: true,
          clearRollbackExists: true,
          clearAuditabilityExists: true,
        },
      },
    });
    expect(submitProposal(r.id).ok).toBe(false);
  });

  it("submits when checklist and fields complete", () => {
    const r = createProposal({
      title: "T3",
      proposedActionType: "a3",
      category: "workflow",
    });
    expect(r.ok).toBe(true);
    fillValidDraft(r.id);
    expect(submitProposal(r.id).ok).toBe(true);
    expect(getProposal(r.id)?.currentStatus).toBe("submitted");
    expect(getLowRiskProposalMonitoringSnapshot().submitted).toBeGreaterThanOrEqual(1);
  });

  it("accepted_to_registry creates inactive registry candidate with sourceProposalId", () => {
    const r = createProposal({
      title: "Registry link",
      proposedActionType: "registryLinkAction",
      category: "configuration",
    });
    expect(r.ok).toBe(true);
    fillValidDraft(r.id);
    expect(submitProposal(r.id).ok).toBe(true);
    expect(acceptProposalToRegistry(r.id).ok).toBe(true);

    const prop = getProposal(r.id);
    expect(prop?.currentStatus).toBe("accepted_to_registry");

    const cand = getFutureReviewCandidate(candidateIdForActionType("registryLinkAction"));
    expect(cand?.sourceProposalId).toBe(r.id);
    expect(cand?.currentStatus).toBe("proposed");
    expect(getLowRiskProposalMonitoringSnapshot().acceptedToRegistry).toBeGreaterThanOrEqual(1);
  });

  it("reject and archive transitions are deterministic", () => {
    const r = createProposal({
      title: "X",
      proposedActionType: "rej",
      category: "other",
    });
    expect(r.ok).toBe(true);
    expect(rejectProposal({ id: r.id }).ok).toBe(true);
    expect(getProposal(r.id)?.currentStatus).toBe("rejected");
    expect(archiveProposal({ id: r.id }).ok).toBe(true);

    const r2 = createProposal({
      title: "Y",
      proposedActionType: "arc",
      category: "other",
    });
    expect(r2.ok).toBe(true);
    expect(archiveProposal({ id: r2.id }).ok).toBe(true);
    expect(getLowRiskProposalMonitoringSnapshot().archived).toBeGreaterThanOrEqual(2);
  });

  it("under_review can accept to registry", () => {
    const r = createProposal({
      title: "R",
      proposedActionType: "underRev",
      category: "reminders",
    });
    expect(r.ok).toBe(true);
    fillValidDraft(r.id);
    expect(submitProposal(r.id).ok).toBe(true);
    expect(beginProposalReview(r.id).ok).toBe(true);
    expect(acceptProposalToRegistry(r.id).ok).toBe(true);
    expect(getFutureReviewCandidate(candidateIdForActionType("underRev"))?.sourceProposalId).toBe(r.id);
  });

  it("approval-execution.service has no proposal module import", () => {
    const path = join(__dirname, "..", "approval-execution.service.ts");
    const src = readFileSync(path, "utf8");
    expect(src.includes("future-low-risk")).toBe(false);
  });
});
