import type {
  LegalDisclaimerItem,
  LegalHubContext,
  LegalHubSummary,
  LegalPendingAction,
  LegalRequirementStatus,
  LegalWorkflowState,
  LegalWorkflowType,
} from "./legal.types";
import { computeLegalReadinessScore } from "./legal-readiness.service";
import { resolveLegalWorkflowsForActor } from "./legal-workflow-definitions";
import { detectLegalRisks } from "./legal-risk-detection.service";

function isoNow(): string {
  return new Date().toISOString();
}

function statusRank(s: LegalRequirementStatus): number {
  switch (s) {
    case "approved":
    case "waived":
      return 4;
    case "submitted":
      return 3;
    case "in_progress":
      return 2;
    case "rejected":
      return 1;
    default:
      return 0;
  }
}

function isRequirementComplete(s: LegalRequirementStatus): boolean {
  return statusRank(s) >= 3 || s === "approved" || s === "waived";
}

function resolveStatus(
  workflowType: LegalWorkflowType,
  requirementId: string,
  ctx: LegalHubContext,
): LegalRequirementStatus {
  const direct = ctx.requirementStates.find(
    (r) => r.workflowType === workflowType && r.requirementId === requirementId,
  );
  return direct?.status ?? "not_started";
}

export function buildLegalWorkflowStates(context: LegalHubContext): LegalWorkflowState[] {
  const defs = resolveLegalWorkflowsForActor(context.actorType);
  const states: LegalWorkflowState[] = [];

  for (const def of defs) {
    const reqBlocks = def.requirements.map((r) => {
      const state = resolveStatus(def.type, r.id, context);
      const meta = context.requirementStates.find(
        (x) => x.workflowType === def.type && x.requirementId === r.id,
      );
      return {
        definition: r,
        state,
        updatedAt: meta?.updatedAt,
      };
    });

    const total = reqBlocks.length || 1;
    const completed = reqBlocks.filter((b) => isRequirementComplete(b.state)).length;
    const completionPercent = Math.min(100, Math.round((completed / total) * 100));

    let currentPendingRequirementId: string | null = null;
    let nextRequiredAction: string | null = null;
    for (const b of reqBlocks) {
      if (!isRequirementComplete(b.state)) {
        currentPendingRequirementId = b.definition.id;
        nextRequiredAction = b.definition.label;
        break;
      }
    }

    states.push({
      workflowType: def.type,
      title: def.title,
      shortDescription: def.shortDescription,
      completionPercent,
      currentPendingRequirementId,
      nextRequiredAction,
      requirements: reqBlocks,
      brokerOrAdminReviewRequired: def.brokerOrAdminReviewRequired,
    });
  }

  return states;
}

function buildDisclaimerItems(lines: string[]): LegalDisclaimerItem[] {
  return lines.map((text, i) => ({
    id: `disc-${i + 1}`,
    text,
    category:
      i === 0 ? ("general" as const) : i >= lines.length - 1 ? ("data" as const) : ("limitation" as const),
  }));
}

function buildPendingActions(workflows: LegalWorkflowState[]): LegalPendingAction[] {
  const pendingActions: LegalPendingAction[] = [];
  for (const w of workflows) {
    if (w.completionPercent < 100 && w.nextRequiredAction) {
      pendingActions.push({
        id: `${w.workflowType}-next`,
        label: w.title,
        detail: w.nextRequiredAction,
        workflowType: w.workflowType,
        requirementId: w.currentPendingRequirementId ?? undefined,
      });
    }
  }
  return pendingActions.slice(0, 24);
}

const BASE_DISCLAIMERS = [
  "LECIPM Legal Hub shows compliance workflow status and document pointers only. It does not provide legal advice.",
  "Use qualified professionals for statutory obligations, negotiations, and binding instruments.",
];

export function buildLegalHubSummary(context: LegalHubContext): LegalHubSummary {
  const workflows = buildLegalWorkflowStates(context);
  const risksRaw = detectLegalRisks(context);
  const risksFiltered = context.flags.legalHubRisksV1 ? risksRaw : [];

  const criticalRiskCount = risksFiltered.filter((r) => r.severity === "critical").length;
  const warningRiskCount = risksFiltered.filter((r) => r.severity === "warning").length;
  const infoRiskCount = risksFiltered.filter((r) => r.severity === "info").length;

  const completedWorkflows = workflows.filter((w) => w.completionPercent >= 100).length;
  const pendingWorkflows = workflows.filter((w) => w.completionPercent < 100).length;

  const disclaimerLines = [
    ...BASE_DISCLAIMERS,
    "Platform guidance may be incomplete where platform records are missing — unavailable signals are left empty on purpose.",
  ];

  const documents = context.flags.legalHubDocumentsV1 ? context.documents : [];
  const pendingActions = buildPendingActions(workflows);

  const reviewNotes = workflows
    .filter((w) => w.brokerOrAdminReviewRequired && w.completionPercent < 100)
    .map(
      (w) =>
        `${w.title}: broker or operator review may be required by platform rules before this workflow can be treated as complete.`,
    );

  const summaryCore: LegalHubSummary = {
    actorType: context.actorType,
    jurisdiction: context.jurisdiction,
    generatedAt: isoNow(),
    disclaimerLines,
    disclaimerItems: buildDisclaimerItems(disclaimerLines),
    pendingActions,
    missingDataWarnings: context.missingDataWarnings,
    availabilityNotes: context.availabilityNotes,
    portfolio: {
      totalWorkflows: workflows.length,
      completedWorkflows,
      pendingWorkflows,
      criticalRiskCount,
      warningRiskCount,
      infoRiskCount,
      documentCount: documents.length,
      pendingActionCount: pendingActions.length,
    },
    workflows,
    risks: risksFiltered,
    documents,
    reviewNotes: reviewNotes.length ? reviewNotes : undefined,
  };

  const readinessScore =
    context.flags.legalReadinessV1 ? computeLegalReadinessScore(summaryCore) : undefined;

  return {
    ...summaryCore,
    ...(readinessScore !== undefined ? { readinessScore } : {}),
  };
}
