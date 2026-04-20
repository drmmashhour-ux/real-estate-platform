import type {
  LegalDisclaimerItem,
  LegalHubActorType,
  LegalHubFlags,
  LegalHubSummary,
  LegalPendingAction,
  LegalRiskItem,
  LegalWorkflowState,
} from "./legal.types";

export type LegalHubHeroModel = {
  title: string;
  subtitle: string;
  actorLabel: string;
  portfolioLine: string;
};

export type LegalWorkflowCardModel = {
  workflowType: string;
  title: string;
  shortDescription: string;
  completionPercent: number;
  pendingLabel: string | null;
  nextAction: string | null;
  reviewBadge: boolean;
};

export type LegalRiskCardModel = {
  id: string;
  severity: LegalRiskItem["severity"];
  title: string;
  message: string;
};

export type LegalHubViewModel = {
  hero: LegalHubHeroModel;
  pendingActions: LegalPendingAction[];
  workflowCards: LegalWorkflowCardModel[];
  riskCards: LegalRiskCardModel[];
  disclaimerParagraphs: string[];
  disclaimerItems: LegalDisclaimerItem[];
  documents: LegalHubSummary["documents"];
  flags: LegalHubFlags;
  missingDataWarnings: string[];
  availabilityNotes?: string[];
  reviewNotes?: string[];
  readinessScore?: LegalHubSummary["readinessScore"];
};

const ACTOR_LABEL: Record<LegalHubActorType, string> = {
  buyer: "Buyer",
  seller: "Seller",
  landlord: "Landlord",
  tenant: "Tenant",
  broker: "Broker",
  host: "Host",
  admin: "Administrator",
};

export function buildLegalHubViewModel(contextSummary: {
  summary: LegalHubSummary;
  actor: LegalHubActorType;
  locale: string;
  flags: LegalHubFlags;
}): LegalHubViewModel {
  const { summary, actor, flags } = contextSummary;
  const p = summary.portfolio;

  const hero: LegalHubHeroModel = {
    title: "Legal & compliance workspace",
    subtitle:
      "Track required steps, documents, and review readiness. This is platform guidance only — not legal advice.",
    actorLabel: ACTOR_LABEL[actor] ?? "User",
    portfolioLine: `${p.completedWorkflows}/${p.totalWorkflows} workflows · ${p.pendingActionCount} pending actions · ${p.documentCount} documents tracked · ${p.criticalRiskCount + p.warningRiskCount} attention items`,
  };

  const workflowCards = buildLegalWorkflowCardModels(summary.workflows);
  const riskCards: LegalRiskCardModel[] = summary.risks.map((r) => ({
    id: r.id,
    severity: r.severity,
    title: r.title,
    message: r.message,
  }));

  return {
    hero,
    pendingActions: summary.pendingActions.slice(0, 8),
    workflowCards,
    riskCards,
    disclaimerParagraphs: summary.disclaimerLines,
    disclaimerItems: summary.disclaimerItems,
    documents: summary.documents,
    flags,
    missingDataWarnings: summary.missingDataWarnings,
    availabilityNotes: summary.availabilityNotes,
    reviewNotes: summary.reviewNotes,
    readinessScore: flags.legalReadinessV1 ? summary.readinessScore : undefined,
  };
}

export function buildLegalWorkflowCardModels(workflows: LegalWorkflowState[]): LegalWorkflowCardModel[] {
  return workflows.map((w) => ({
    workflowType: w.workflowType,
    title: w.title,
    shortDescription: w.shortDescription,
    completionPercent: w.completionPercent,
    pendingLabel: w.currentPendingRequirementId,
    nextAction: w.nextRequiredAction,
    reviewBadge: w.brokerOrAdminReviewRequired,
  }));
}
