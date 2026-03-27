import { ImpactBand } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import type {
  FutureOutcomeActionItem,
  FutureOutcomeCaseInput,
  FutureOutcomeDocumentItem,
  FutureOutcomeRiskItem,
  FutureOutcomeTimelineStep,
} from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";

export function buildTimelineSteps(
  input: OfferScenarioInput,
  result: OfferSimulationResult,
  caseState: FutureOutcomeCaseInput | null | undefined,
): FutureOutcomeTimelineStep[] {
  const steps: FutureOutcomeTimelineStep[] = [];
  let ti = 0;

  steps.push({
    id: `tl-${ti++}`,
    title: "Offer prepared and submitted",
    description:
      "Buyer side finalizes terms, deposits (if any), and conditions; broker routes the promise to purchase according to brokerage process.",
    typicalDurationHint: "Often a few days to align signatures — not guaranteed.",
  });

  if (input.inspectionCondition) {
    steps.push({
      id: `tl-${ti++}`,
      title: "Inspection / due diligence window",
      description:
        "If the promise includes an inspection condition, buyers typically schedule visits and review findings before waiving or negotiating.",
      typicalDurationHint: "Commonly roughly 5–14 days when a condition is used — varies by agreement.",
    });
  }

  if (input.financingCondition) {
    steps.push({
      id: `tl-${ti++}`,
      title: "Financing approval period",
      description:
        "Lender review, appraisal, and approval conditions run in parallel with other workstreams; firming depends on lender timelines.",
      typicalDurationHint: "Often several business days to a few weeks — lender-dependent.",
    });
  }

  if (input.documentReviewCondition) {
    steps.push({
      id: `tl-${ti++}`,
      title: "Title and document review",
      description:
        "Review of title, certificate of location, minutes, and other documents as agreed — may surface follow-up questions.",
      typicalDurationHint: "Typically multi-day — depends on notaire and complexity.",
    });
  }

  if (caseState && (caseState.legalBlockingIssues.length > 0 || caseState.blockerLabels.length > 0)) {
    steps.push({
      id: `tl-${ti++}`,
      title: "Resolve open file items",
      description:
        "Current case snapshot shows blockers on the seller declaration or legal graph; real closings usually wait until these are cleared or contractually addressed.",
      typicalDurationHint: null,
    });
  }

  steps.push({
    id: `tl-${ti++}`,
    title: "Pre-closing preparation",
    description:
      "Insurance, adjustments, final walkthrough (if any), and signing appointment with the notaire — subject to local practice.",
    typicalDurationHint: null,
  });

  steps.push({
    id: `tl-${ti++}`,
    title: "Signing and closing",
    description:
      "Notarial deed, disbursement, and possession/occupancy as agreed. Dates in the simulator are illustrations only unless fixed in a binding contract.",
    typicalDurationHint:
      input.occupancyDate || input.signatureDate
        ? "You entered target dates — treat them as placeholders until confirmed in writing."
        : null,
  });

  if (result.riskImpact.band === ImpactBand.Elevated || result.riskImpact.band === ImpactBand.Caution) {
    steps.push({
      id: `tl-${ti++}`,
      title: "Extra buffer for negotiation",
      description:
        "This scenario shows elevated modeled risk — parties may need additional negotiation or documentation before firming.",
      typicalDurationHint: null,
    });
  }

  return steps;
}

export function buildPossibleRisks(
  input: OfferScenarioInput,
  result: OfferSimulationResult,
  caseState: FutureOutcomeCaseInput | null | undefined,
): FutureOutcomeRiskItem[] {
  const risks: FutureOutcomeRiskItem[] = [];
  let ri = 0;

  for (const w of result.keyWarnings.slice(0, 6)) {
    risks.push({
      id: `rk-${ri++}`,
      title: "Modeled scenario warning",
      detail: w,
      source: "scenario",
    });
  }

  if (!input.inspectionCondition) {
    risks.push({
      id: `rk-${ri++}`,
      title: "Physical condition less hedged",
      detail:
        "Without an inspection condition in this model, fewer contractual outs relate to property condition — buyers may carry more residual uncertainty.",
      source: "scenario",
    });
  }

  if (!input.financingCondition) {
    risks.push({
      id: `rk-${ri++}`,
      title: "Financing less hedged",
      detail:
        "Without a financing condition, firming may expose the buyer if lender approval shifts — confirm with your broker before removing protections in real life.",
      source: "scenario",
    });
  }

  if (!input.documentReviewCondition) {
    risks.push({
      id: `rk-${ri++}`,
      title: "Document review less hedged",
      detail:
        "Without a document review condition, fewer contractual outs relate to title or condo documents — diligence timing may compress.",
      source: "scenario",
    });
  }

  if (caseState) {
    for (const b of caseState.blockerLabels.slice(0, 4)) {
      risks.push({
        id: `rk-${ri++}`,
        title: "Open case item",
        detail: b,
        source: "case_file",
      });
    }
    for (const m of caseState.legalBlockingIssues.slice(0, 3)) {
      risks.push({
        id: `rk-${ri++}`,
        title: "Legal graph blocker",
        detail: m,
        source: "case_file",
      });
    }
    if (caseState.knowledgeBlockCount > 0) {
      risks.push({
        id: `rk-${ri++}`,
        title: "Mandatory disclosure gap (rules engine)",
        detail:
          "Knowledge-base rules still flag mandatory disclosure gaps — sellers may need to update declarations before buyers rely on a clean file.",
        source: "case_file",
      });
    }
    if (caseState.documentPanels.sellerDeclaration === "incomplete" || caseState.documentPanels.sellerDeclaration === "blocked") {
      risks.push({
        id: `rk-${ri++}`,
        title: "Seller declaration incomplete or blocked",
        detail:
          "The seller-side declaration panel is not complete in this snapshot — downstream signing readiness may lag.",
        source: "combined",
      });
    }
  }

  return risks.slice(0, 14);
}

export function buildRequiredActions(
  input: OfferScenarioInput,
  caseState: FutureOutcomeCaseInput | null | undefined,
): FutureOutcomeActionItem[] {
  const actions: FutureOutcomeActionItem[] = [];
  let ai = 0;

  actions.push({
    id: `ac-${ai++}`,
    role: "buyer",
    label: "Confirm deposit amount, dates, and each condition in writing with your broker before relying on this illustration.",
  });
  actions.push({
    id: `ac-${ai++}`,
    role: "broker",
    label: "Record the promise details, manage timelines for waivers, and coordinate lender / inspector / notaire handoffs as applicable.",
  });

  if (input.financingCondition) {
    actions.push({
      id: `ac-${ai++}`,
      role: "buyer",
      label: "Provide lender documents early; track appraisal and approval milestones inside the financing window.",
    });
  }

  if (input.inspectionCondition) {
    actions.push({
      id: `ac-${ai++}`,
      role: "buyer",
      label: "Book inspection promptly; decide on waivers or amendments before the condition deadline.",
    });
  }

  if (caseState?.primaryNextAction) {
    actions.push({
      id: `ac-${ai++}`,
      role: "any",
      label: `Case command center next step: ${caseState.primaryNextAction}`,
    });
  }

  if (caseState?.documentPanels.review === "incomplete" || caseState?.documentPanels.review === "blocked") {
    actions.push({
      id: `ac-${ai++}`,
      role: "broker",
      label: "Complete review workflow tasks flagged for this file before pushing a firm closing date with clients.",
    });
  }

  return actions;
}

export function buildRequiredDocuments(input: OfferScenarioInput, caseState: FutureOutcomeCaseInput | null | undefined): FutureOutcomeDocumentItem[] {
  const docs: FutureOutcomeDocumentItem[] = [];
  let di = 0;

  docs.push({
    id: `dc-${di++}`,
    label: "Identification and contact instructions (parties)",
    reason: "Standard for any formal offer pathway — exact list comes from your broker and notaire.",
  });

  if (input.financingCondition) {
    docs.push({
      id: `dc-${di++}`,
      label: "Lender pre-approval / financing package",
      reason: "Financing condition assumes lender review against this property.",
    });
  }

  if (input.inspectionCondition) {
    docs.push({
      id: `dc-${di++}`,
      label: "Inspection report and any amendment requests",
      reason: "Supports waiver or renegotiation inside the inspection window.",
    });
  }

  if (input.documentReviewCondition) {
    docs.push({
      id: `dc-${di++}`,
      label: "Title, certificate of location, condo minutes (if applicable)",
      reason: "Document review condition assumes these can be obtained and reviewed.",
    });
  }

  if (caseState && (caseState.knowledgeWarningCount > 0 || caseState.warningLabels.length > 0)) {
    docs.push({
      id: `dc-${di++}`,
      label: "Updated seller declarations or annexes",
      reason: "Warnings on file suggest clarifications may be needed before parties finalize.",
    });
  }

  return docs;
}
