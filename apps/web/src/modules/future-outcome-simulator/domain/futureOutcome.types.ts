import type { CaseHealthStatus, CaseSignatureReadinessStatus } from "@/src/modules/case-command-center/domain/case.types";
import type { SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferScenarioInput, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

/** Qualitative confidence — never implies a guaranteed market outcome. */
export type FutureOutcomeConfidenceLevel = "low" | "medium" | "high";

export type FutureOutcomeReadinessImpact = {
  summary: string;
  /** Mirrors simulator readiness band for consistency. */
  bandLabel: string;
  /** Case + scenario combined note (deterministic). */
  caseAlignmentNote: string;
};

export type FutureOutcomeTimelineStep = {
  id: string;
  title: string;
  description: string;
  /** Relative order only; not a commitment of calendar dates. */
  typicalDurationHint: string | null;
};

export type FutureOutcomeRiskItem = {
  id: string;
  title: string;
  detail: string;
  source: "scenario" | "case_file" | "combined";
};

export type FutureOutcomeActionItem = {
  id: string;
  role: "buyer" | "broker" | "seller_side" | "any";
  label: string;
};

export type FutureOutcomeDocumentItem = {
  id: string;
  label: string;
  reason: string;
};

/**
 * Slim case + file state passed into the simulator (no LLM).
 * Built from {@link CaseHealthSnapshot} when available.
 */
export type FutureOutcomeCaseInput = {
  caseStatus: CaseHealthStatus;
  signatureReadinessStatus: CaseSignatureReadinessStatus;
  blockerLabels: string[];
  warningLabels: string[];
  primaryNextAction: string;
  documentPanels: {
    sellerDeclaration: "complete" | "incomplete" | "blocked";
    contract: "complete" | "incomplete" | "blocked";
    review: "complete" | "incomplete" | "blocked";
  };
  legalFileHealth: string;
  legalBlockingIssues: string[];
  knowledgeBlockCount: number;
  knowledgeWarningCount: number;
};

/** Optional listing-level signals (same source as offer simulator context). */
export type FutureOutcomeDealSignals = {
  trustScore: number | null;
  completenessPercent: number;
  blockerCount: number;
  contradictionCount: number;
};

export type FutureOutcomeInput = {
  propertyId: string;
  listPriceCents: number;
  scenarioInput: OfferScenarioInput;
  simulationResult: OfferSimulationResult;
  /** When omitted, timeline/risk still run from scenario + simulation only. */
  caseState?: FutureOutcomeCaseInput | null;
  /** From listing + declaration validation when available. */
  dealSignals?: FutureOutcomeDealSignals | null;
};

export type FutureOutcomeResult = {
  timelineSteps: FutureOutcomeTimelineStep[];
  possibleRisks: FutureOutcomeRiskItem[];
  requiredActions: FutureOutcomeActionItem[];
  requiredDocuments: FutureOutcomeDocumentItem[];
  readinessImpact: FutureOutcomeReadinessImpact;
  confidenceLevel: FutureOutcomeConfidenceLevel;
  /** Maps from simulator confidence + data gaps. */
  simulationConfidence: SimulationConfidence;
  warnings: string[];
  advisoryDisclaimer: string;
};
