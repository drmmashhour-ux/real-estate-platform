import { randomUUID } from "crypto";
import { complianceFlags, engineFlags, legalHubFlags } from "@/config/feature-flags";
import { buildCertificateOfLocationPreviewLines } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-preview-bridge.service";
import { buildLegalPreviewOverlayForListing } from "@/modules/legal/records/legal-record-preview.service";
import { recordAutonomousMarketplaceGovernanceTimeline } from "@/modules/events/marketplace-timeline.integration";
import { autonomyConfig } from "../config/autonomy.config";
import { defaultDetectorRegistry } from "../detectors/detector-registry";
import { resolveGovernance } from "../governance/governance-resolver";
import { evaluateUnifiedGovernance } from "../governance/unified-governance.service";
import { autonomyLog } from "../internal/autonomy-log";
import { evaluateActionPolicy } from "../policy/policy-engine";
import { persistAutonomousRun } from "../persistence/autonomy-repository";
import { runListingPreviewDetectors } from "../detectors/preview-detector-registry";
import { buildObservationForCampaign, buildObservationForLead, buildObservationForListing } from "../signals/observation-builder";
import { buildUnifiedListingObservation } from "../signals/listing-observation-builder.service";
import { buildSyriaListingObservationSnapshot } from "@/modules/integrations/regions/syria/syria-preview-adapter.service";
import { buildSyriaOpportunities } from "@/modules/integrations/regions/syria/syria-opportunity-builder.service";
import { buildSyriaPreviewNoteLines } from "@/modules/integrations/regions/syria/syria-preview-notes.service";
import { evaluateSyriaApprovalBoundary } from "@/modules/integrations/regions/syria/syria-approval-boundary.service";
import { buildSyriaGovernanceExplainabilityLines } from "@/modules/integrations/regions/syria/syria-governance-explainability.service";
import { resolveSyriaGovernanceReviewType } from "@/modules/integrations/regions/syria/syria-governance-review.service";
import { evaluateSyriaPreviewPolicyFromSignals } from "@/modules/integrations/regions/syria/syria-policy.service";
import { buildSyriaSignals } from "@/modules/integrations/regions/syria/syria-signal-builder.service";
import { explainSyriaSignals } from "@/modules/integrations/regions/syria/syria-signal-explainability.service";
import { getSyriaCapabilityNotes } from "@/modules/integrations/regions/syria/syria-region-capabilities.service";
import { SYRIA_REGION_CODE } from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import { buildRegionListingKey, buildRegionListingRef, DEFAULT_WEB_REGION_CODE } from "@/modules/integrations/regions/region-listing-key.service";
import type {
  ListingPreviewOpportunityEvaluation,
  ListingPreviewResponse,
  PreviewListingInput,
} from "../types/listing-preview.types";
import type { TrustScore } from "@/modules/trust/trust.types";
import type {
  AutonomyMode,
  AutonomousRun,
  AutonomousRunSummary,
  ExecutionResult,
  MarketplaceSignal,
  ObservationSnapshot,
  Opportunity,
  ProposedAction,
  RiskLevel,
} from "../types/domain.types";
import { aggregateSignalsForTarget, buildSignalsSummary } from "../signals/signal-normalizer";
import { buildPreviewSignalsForListing } from "../signals/preview-signal-builder.service";
import { buildPreviewOpportunitiesFromSignals } from "./preview-opportunity-builder.service";
import { evaluateListingPreviewPolicy } from "../policy/preview-policy.service";
import { filterPreviewActionsByPolicy } from "./preview-action-filter.service";
import {
  buildPreviewExplanation,
  emptyListingPreviewExplanation,
} from "../explainability/preview-explainability-builder.service";
import { buildSyriaPreviewStructuredExplainability } from "../explainability/syria-preview-explainability.service";
import type { ListingPreviewExplanation } from "../explainability/preview-explainability.types";
import { buildPolicyContext } from "./policy-context-builder";
import { findRecentRunByIdempotencyKey } from "./idempotency.service";
import { dispatchExecution } from "./action-dispatch";
import { DEFAULT_PLATFORM_REGION_CODE } from "@lecipm/platform-core";
import { runControlledExecution } from "./controlled-execution-orchestrator.service";
import {
  buildListingExplanation,
  buildUserSafeListingReasoning,
} from "../explainability/explainability-builder.service";
import type { ExplanationLevel, ListingExplanation } from "../explainability/explainability.types";

export type RunOptions = {
  mode?: AutonomyMode;
  dryRun?: boolean;
  idempotencyKey?: string;
  detectorIds?: string[];
  actionTypes?: string[];
  createdByUserId?: string | null;
};

const IDEMPOTENCY_TTL_MS = 3600000;

function dedupeActions(actions: ProposedAction[]): ProposedAction[] {
  const seen = new Set<string>();
  const out: ProposedAction[] = [];
  for (const a of actions) {
    const k = `${a.type}:${a.target.type}:${a.target.id ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}

/** Preview-only — never implies executor dispatch. */
function tagPreviewDryRunOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities.map((o) => ({
    ...o,
    proposedActions: o.proposedActions.map((a) => ({
      ...a,
      metadata: {
        ...a.metadata,
        previewExecution: "DRY_RUN" as const,
      },
    })),
  }));
}

function riskBucketsFromProposedActions(actions: ProposedAction[]): Record<RiskLevel, number> {
  const b: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const a of actions) {
    const r = a.risk;
    if (r === "LOW" || r === "MEDIUM" || r === "HIGH" || r === "CRITICAL") {
      b[r]++;
    }
  }
  return b;
}

function buildPreviewExplanationBundle(params: {
  listingId: string;
  signals: MarketplaceSignal[];
  observation: ObservationSnapshot;
  opportunities: Opportunity[];
  proposedActions: ProposedAction[];
  policyDecisions: ListingPreviewResponse["policyDecisions"];
  levelOverride?: ExplanationLevel;
}): { explanation: ListingExplanation | null; userSafeReasoningSummary: string | null } {
  if (!engineFlags.autonomyExplainabilityV1) {
    return { explanation: null, userSafeReasoningSummary: null };
  }
  try {
    const level: ExplanationLevel =
      params.levelOverride ??
      (engineFlags.autonomyExplainabilityDebugV1 === true ? "debug" : "detailed");
    const explanation = buildListingExplanation({
      listingId: params.listingId,
      signals: params.signals,
      opportunities: params.opportunities,
      policyDecisions: params.policyDecisions,
      proposedActions: params.proposedActions,
      observation: params.observation,
      level,
      includeDebugRuleRefs: engineFlags.autonomyExplainabilityDebugV1 === true,
    });
    const userSafeReasoningSummary = buildUserSafeListingReasoning(explanation).summary;
    return { explanation, userSafeReasoningSummary };
  } catch {
    return { explanation: null, userSafeReasoningSummary: null };
  }
}

export class AutonomousMarketplaceEngine {
  /**
   * Preview-only: read-only observation + detectors + policy evaluate — never executes.
   * With `FEATURE_AUTONOMY_PREVIEW_REAL_V1`: full detector registry + full policy rules (still DRY_RUN).
   */
  async previewForListing(listingIdOrInput: string | PreviewListingInput): Promise<ListingPreviewResponse> {
    if (typeof listingIdOrInput === "string") {
      return this.previewForWebFsboListing(listingIdOrInput.trim());
    }
    const rawId = typeof listingIdOrInput.listingId === "string" ? listingIdOrInput.listingId.trim() : "";
    if (listingIdOrInput.source === "syria") {
      return this.previewForSyriaListing(rawId);
    }
    if (listingIdOrInput.source === "external") {
      return this.previewExternalListingPlaceholder(rawId);
    }
    return this.previewForWebFsboListing(rawId);
  }

  private async buildPreviewEvaluations(
    listingId: string,
    observation: ObservationSnapshot,
    opportunities: Opportunity[],
    autonomyMode: AutonomyMode,
  ): Promise<{
    proposedActions: ProposedAction[];
    policyDecisions: ListingPreviewResponse["policyDecisions"];
    opportunityEvaluations: ListingPreviewOpportunityEvaluation[];
  }> {
    const proposedActionsFlat = opportunities.flatMap((o) => o.proposedActions);
    const policyDecisions = await evaluateListingPreviewPolicy({
      listingId,
      observation,
      opportunities,
      proposedActions: proposedActionsFlat,
      autonomyMode,
    });
    const filteredFull = filterPreviewActionsByPolicy({
      proposedActions: proposedActionsFlat,
      policyDecisions,
    });
    const proposedActions = filteredFull.slice(0, 5);
    const annotatedById = new Map(filteredFull.map((a) => [a.id, a]));
    const outputIds = new Set(proposedActions.map((a) => a.id));

    let pi = 0;
    const opportunityEvaluations: ListingPreviewOpportunityEvaluation[] = [];
    for (const opp of opportunities) {
      const actions: ListingPreviewOpportunityEvaluation["actions"] = [];
      for (const action of opp.proposedActions) {
        const policy = policyDecisions[pi];
        pi += 1;
        if (!policy) continue;
        const ann = annotatedById.get(action.id);
        if (!ann || !outputIds.has(action.id)) continue;
        actions.push({ proposedAction: ann, policy });
      }
      opportunityEvaluations.push({
        opportunityId: opp.id,
        detectorId: opp.detectorId,
        title: opp.title,
        actions,
      });
    }

    return { proposedActions, policyDecisions, opportunityEvaluations };
  }

  private async previewForWebFsboListing(listingId: string): Promise<ListingPreviewResponse> {
    console.info("[autonomous-marketplace] preview run");
    const builtAt = new Date().toISOString();
    const autonomyMode: AutonomyMode = "OFF";
    const realPreview = engineFlags.autonomyPreviewRealV1 === true;

    const [{ snapshot: metrics, observation: observationRaw }, quebecCompliancePreview] = await Promise.all([
      buildUnifiedListingObservation(listingId),
      (async () => {
        try {
          if (!complianceFlags.quebecComplianceV1) return null;
          const { buildListingQuebecCompliancePreview } = await import(
            "@/modules/legal/compliance/listing-publish-compliance.service"
          );
          return await buildListingQuebecCompliancePreview(listingId);
        } catch {
          return null;
        }
      })(),
    ]);

    const observationForDetectors = observationRaw;
    const observation: ListingPreviewResponse["observation"] = observationForDetectors ?? {
      id: `preview-obs-${listingId}`,
      target: {
        type: "fsbo_listing",
        id: listingId,
        label: metrics ? `listing-${listingId}` : undefined,
      },
      signals: [],
      aggregates: {},
      facts: {
        preview: true,
        mock: metrics === null,
        metrics,
      },
      builtAt,
    };

    if (observationForDetectors) {
      observation.facts = {
        ...observationForDetectors.facts,
        preview: true,
        metrics,
      };
    }

    const realPipelineV1 = engineFlags.autonomyRealPreviewV1 === true;
    const previewExplainabilityV1 = engineFlags.autonomyPreviewExplainabilityV1 === true;

    let signals: MarketplaceSignal[] = observation.signals;
    let opportunities: Opportunity[];
    let ev: {
      proposedActions: ProposedAction[];
      policyDecisions: ListingPreviewResponse["policyDecisions"];
      opportunityEvaluations: ListingPreviewOpportunityEvaluation[];
    };

    let previewExplanationPayload: ListingPreviewExplanation | null = null;

    if (realPipelineV1) {
      const previewSignals = await buildPreviewSignalsForListing(listingId, observation);
      observation.signals = previewSignals;
      observation.aggregates = aggregateSignalsForTarget(previewSignals);

      const previewOppsUntagged = buildPreviewOpportunitiesFromSignals(previewSignals, observation);
      opportunities = tagPreviewDryRunOpportunities(previewOppsUntagged);

      const flatActions = opportunities.flatMap((o) => o.proposedActions);
      const previewPolicyDecisions = await evaluateListingPreviewPolicy({
        listingId,
        observation,
        opportunities,
        proposedActions: flatActions,
        autonomyMode,
      });
      const filteredFull = filterPreviewActionsByPolicy({
        proposedActions: flatActions,
        policyDecisions: previewPolicyDecisions,
      });
      const filteredActions = filteredFull.slice(0, 5);
      const annotatedById = new Map(filteredFull.map((a) => [a.id, a]));
      const outputIds = new Set(filteredActions.map((a) => a.id));

      let pi = 0;
      const opportunityEvaluationsReal: ListingPreviewOpportunityEvaluation[] = [];
      for (const opp of opportunities) {
        const actions: ListingPreviewOpportunityEvaluation["actions"] = [];
        for (const action of opp.proposedActions) {
          const policy = previewPolicyDecisions[pi];
          pi += 1;
          if (!policy) continue;
          const ann = annotatedById.get(action.id);
          if (!ann || !outputIds.has(action.id)) continue;
          actions.push({ proposedAction: ann, policy });
        }
        opportunityEvaluationsReal.push({
          opportunityId: opp.id,
          detectorId: opp.detectorId,
          title: opp.title,
          actions,
        });
      }

      ev = {
        proposedActions: filteredActions,
        policyDecisions: previewPolicyDecisions,
        opportunityEvaluations: opportunityEvaluationsReal,
      };

      signals = previewSignals;

      const legalOverlay =
        previewExplainabilityV1 && legalHubFlags.legalAiLogicV1 && legalHubFlags.legalRecordImportV1 ?
          await buildLegalPreviewOverlayForListing(listingId)
        : { readinessLines: [], ruleImpacts: [] };

      const certificateOfLocationLines = await buildCertificateOfLocationPreviewLines(listingId);

      const quebecComplianceLines: string[] = [];
      if (quebecCompliancePreview?.appliesToJurisdiction) {
        quebecComplianceLines.push(
          `Québec compliance readiness index: ${quebecCompliancePreview.readinessScore}/100 (preview only — no writes).`,
          quebecCompliancePreview.allowed
            ? "Required compliance checks for this snapshot are satisfied for publishing eligibility."
            : "Publishing would be blocked until missing or invalid items are addressed or verified.",
        );
        for (const line of quebecCompliancePreview.userSafeReasons.slice(0, 6)) {
          quebecComplianceLines.push(line);
        }
      } else if (quebecCompliancePreview && !quebecCompliancePreview.appliesToJurisdiction) {
        quebecComplianceLines.push(
          "Québec publish checklist applies to CA listings in Québec — this preview target is outside that scope.",
        );
      }

      previewExplanationPayload =
        previewExplainabilityV1 ?
          buildPreviewExplanation({
            listingId,
            metrics,
            observation,
            signals: previewSignals,
            opportunities,
            proposedActions: filteredActions,
            policyDecisions: previewPolicyDecisions,
            legalReadinessLines: legalOverlay.readinessLines,
            legalRuleImpacts: legalOverlay.ruleImpacts,
            quebecComplianceLines,
            certificateOfLocationLines,
          })
        : emptyListingPreviewExplanation(listingId);
    } else {
      const opportunitiesUntagged =
        observationForDetectors ?
          runListingPreviewDetectors(observationForDetectors, { fullRegistry: realPreview })
        : [];
      opportunities = tagPreviewDryRunOpportunities(opportunitiesUntagged);
      ev = await this.buildPreviewEvaluations(listingId, observation, opportunities, autonomyMode);
    }

    const riskBuckets = riskBucketsFromProposedActions(ev.proposedActions);
    const skippedIds = [...ev.proposedActions].sort((a, b) => a.id.localeCompare(b.id)).map((a) => a.id);
    const regionListingRef =
      engineFlags.regionListingKeyV1 && listingId
        ? buildRegionListingRef(
            buildRegionListingKey({
              regionCode: DEFAULT_WEB_REGION_CODE,
              source: "web",
              listingId,
            }),
          )
        : null;

    const reasoning = buildPreviewExplanationBundle({
      listingId,
      signals,
      observation,
      opportunities,
      proposedActions: ev.proposedActions,
      policyDecisions: ev.policyDecisions,
    });

    let propertyPublishCompliance: ListingPreviewResponse["propertyPublishCompliance"] = null;
    let propertyLegalRiskOut: ListingPreviewResponse["propertyLegalRisk"] = null;
    let legalTrustRanking: ListingPreviewResponse["legalTrustRanking"] = null;
    if (complianceFlags.quebecListingComplianceV1 === true && complianceFlags.quebecComplianceV1 === true) {
      try {
        const { loadQuebecComplianceEvaluatorInput } = await import(
          "@/modules/legal/compliance/listing-publish-compliance.service",
        );
        const { evaluateQuebecListingCompliance, buildPropertyPublishComplianceSummary } = await import(
          "@/modules/legal/compliance/quebec-listing-compliance-evaluator.service",
        );
        const { computePropertyLegalRiskScore } = await import("@/modules/legal/scoring/property-legal-risk-score.service");
        const { computeLegalTrustRankingImpact } = await import("@/modules/trust-ranking/legal-trust-ranking.service");
        const { brokerAiFlags } = await import("@/config/feature-flags");
        const inp = await loadQuebecComplianceEvaluatorInput(listingId);
        if (inp) {
          const ce = evaluateQuebecListingCompliance({ evaluatorInput: inp });
          let certificateSignals:
            | { readinessPenalty01: number; mismatchCount: number; timelineFlagged?: boolean }
            | undefined;
          if (brokerAiFlags.brokerAiCertificateOfLocationV2) {
            try {
              const { buildCertificateLocationObservationFacts } = await import(
                "@/modules/broker-ai/certificate-of-location/certificate-of-location-observation-bridge.service",
              );
              const certFacts = await buildCertificateLocationObservationFacts(listingId);
              if (certFacts) {
                certificateSignals = {
                  readinessPenalty01: certFacts.readinessPenalty01,
                  mismatchCount: certFacts.consistencyMismatchCount,
                  timelineFlagged: certFacts.timelineFlagged,
                };
              }
            } catch {
              certificateSignals = undefined;
            }
          }
          const lr = computePropertyLegalRiskScore({
            listingId,
            complianceEvaluation: ce,
            manualReviewCompleted: false,
            identityVerifiedStrong:
              inp.listing.verificationIdentityStage === "VERIFIED" ||
              inp.listing.verificationIdentityStage === "APPROVED",
            ownershipRecordValidated: (inp.legalRecords ?? []).some(
              (r) => r.recordType === "proof_of_ownership" && r.status === "validated",
            ),
            rejectionCycles: inp.documentRejectionLoop ? 3 : 0,
            ...(certificateSignals ? { certificateSignals } : {}),
          });
          propertyPublishCompliance = buildPropertyPublishComplianceSummary({
            listingId,
            evaluation: ce,
            legalRiskScore: lr.score,
          });
          propertyLegalRiskOut = lr;
          const trustStub: TrustScore = {
            score: 58,
            level: "medium",
            confidence: "low",
            factors: [],
          };
          legalTrustRanking = computeLegalTrustRankingImpact({
            listingId,
            trustScore: trustStub,
            publishSummary: propertyPublishCompliance,
            prepublishBlocked: !ce.requiredChecklistPassed,
            isPublishedVisible: false,
          });
        }
      } catch {
        propertyPublishCompliance = null;
        propertyLegalRiskOut = null;
        legalTrustRanking = null;
      }
    }

    return {
      listingId,
      autonomyMode,
      metrics,
      signals,
      observation,
      opportunities,
      proposedActions: ev.proposedActions,
      policyDecisions: ev.policyDecisions,
      opportunityEvaluations: ev.opportunityEvaluations,
      ...(reasoning.explanation !== null ?
        {
          explanation: reasoning.explanation,
          userSafeReasoningSummary: reasoning.userSafeReasoningSummary,
        }
      : {}),
      ...(previewExplanationPayload !== null ? { previewExplanation: previewExplanationPayload } : {}),
      flags: {
        realPreviewEnabled: realPipelineV1,
        explainabilityEnabled:
          previewExplainabilityV1 || engineFlags.autonomyExplainabilityV1 === true,
      },
      executionResult: {
        status: "DRY_RUN",
        startedAt: builtAt,
        finishedAt: builtAt,
        detail:
          realPipelineV1 ? "Real preview simulation — deterministic signals and policies; no execution performed."
          : realPreview ? "Real-data preview — policy evaluated; no execution performed."
          : "Preview only — no execution performed.",
        executedActions: [],
        skippedActions: skippedIds,
        reasons: ["preview mode"],
        metadata: {
          previewMode: true,
          autonomyPreviewRealV1: realPreview,
          autonomyRealPreviewV1: realPipelineV1,
          mock: metrics === null,
        },
      },
      riskBuckets,
      ...(regionListingRef !== null ? { regionListingRef } : {}),
      quebecCompliancePreview,
      ...(propertyPublishCompliance !== null ? { propertyPublishCompliance } : {}),
      ...(propertyLegalRiskOut !== null ? { propertyLegalRisk: propertyLegalRiskOut } : {}),
      ...(legalTrustRanking !== null ? { legalTrustRanking } : {}),
    };
  }

  private async previewForSyriaListing(listingId: string): Promise<ListingPreviewResponse> {
    console.info("[autonomous-marketplace] preview run (syria)");
    const builtAt = new Date().toISOString();
    const autonomyMode: AutonomyMode = "OFF";
    const capabilityNotes = [...getSyriaCapabilityNotes()];
    const previewNotes: string[] = [...capabilityNotes];

    if (!listingId) {
      previewNotes.push("syria_preview_listing_id_missing");
      return this.syriaPreviewEmpty(
        "",
        builtAt,
        previewNotes,
        capabilityNotes,
        "Listing id required for Syria preview.",
      );
    }

    if (!engineFlags.syriaRegionAdapterV1) {
      previewNotes.push("syria_region_adapter_disabled");
      return this.syriaPreviewEmpty(listingId, builtAt, previewNotes, capabilityNotes, "Syria region adapter disabled.");
    }

    if (!engineFlags.syriaPreviewV1) {
      previewNotes.push("syria_preview_feature_disabled");
      return this.syriaPreviewEmpty(listingId, builtAt, previewNotes, capabilityNotes, "Syria preview flag disabled.");
    }

    const snap = await buildSyriaListingObservationSnapshot(listingId);
    previewNotes.push(...snap.availabilityNotes);

    const realPreview = engineFlags.autonomyPreviewRealV1 === true;
    const observationForDetectors = snap.observation;
    const opportunitiesUntagged =
      observationForDetectors ?
        runListingPreviewDetectors(observationForDetectors, { fullRegistry: realPreview })
      : [];
    const opportunities = tagPreviewDryRunOpportunities(opportunitiesUntagged);

    const observation: ListingPreviewResponse["observation"] =
      observationForDetectors ??
      ({
        id: `preview-syria-${listingId}-${builtAt}`,
        target: { type: "syria_listing", id: listingId, label: undefined },
        signals: [],
        aggregates: {},
        facts: {
          preview: true,
          syriaPreview: true,
          metrics: snap.metrics,
          ...snap.facts,
        },
        builtAt,
      } as ObservationSnapshot);

    const syriaSignals = buildSyriaSignals(observation);
    const syriaOpportunities = buildSyriaOpportunities(syriaSignals);
    const syriaSignalExplainability = explainSyriaSignals(syriaSignals);
    const syriaPolicyPreview = evaluateSyriaPreviewPolicyFromSignals(syriaSignals, observation);
    const syriaApprovalBoundary = evaluateSyriaApprovalBoundary({ policy: syriaPolicyPreview });

    const factRecord =
      observation.facts && typeof observation.facts === "object" ?
        (observation.facts as Record<string, unknown>)
      : {};
    const reviewType = resolveSyriaGovernanceReviewType({
      policy: syriaPolicyPreview,
      facts: factRecord,
      signals: syriaSignals,
    });
    const syriaPolicyDecision = {
      decision: syriaPolicyPreview.decision,
      rationale: syriaPolicyPreview.rationale,
      reviewType,
    };

    previewNotes.length = 0;
    previewNotes.push(
      ...buildSyriaPreviewNoteLines([...capabilityNotes, ...snap.availabilityNotes], syriaSignals, syriaPolicyPreview),
    );

    const ev = await this.buildPreviewEvaluations(listingId, observation, opportunities, autonomyMode);
    const skippedIds = [...ev.proposedActions].sort((a, b) => a.id.localeCompare(b.id)).map((a) => a.id);

    const riskBuckets = {
      LOW: syriaSignals.filter((s) => s.severity === "info").length,
      MEDIUM: 0,
      HIGH: syriaSignals.filter((s) => s.severity === "warning").length,
      CRITICAL: syriaSignals.filter((s) => s.severity === "critical").length,
    };

    const regionListingRef =
      engineFlags.regionListingKeyV1 && listingId
        ? buildRegionListingRef(
            buildRegionListingKey({
              regionCode: SYRIA_REGION_CODE,
              source: "syria",
              listingId,
            }),
          )
        : null;

    const unifiedSignals = syriaSignals.map((s) => ({
      type: s.type,
      severity: s.severity as "info" | "warning" | "critical",
      metadata: {
        message: s.message,
        ...(s.contributingMetrics as Record<string, unknown>),
      },
    }));

    const unifiedGovernance = await evaluateUnifiedGovernance({
      mode: "preview",
      regionCode: SYRIA_REGION_CODE,
      listingId,
      listingDisplayId: regionListingRef?.displayId ?? undefined,
      listingStatus:
        typeof factRecord.syriaListingStatus === "string"
          ? factRecord.syriaListingStatus
          : typeof observation.facts?.syriaListingStatus === "string"
            ? String(observation.facts.syriaListingStatus)
            : undefined,
      fraudFlag: factRecord.fraudFlag === true,
      signals: unifiedSignals,
      featureFlags: {
        syriaAdapterDisabled: engineFlags.syriaRegionAdapterV1 !== true,
      },
      metadata: { listingSource: "syria", preview: true },
    });

    const syriaStructuredExplain = buildSyriaPreviewStructuredExplainability({
      policy: syriaPolicyPreview,
      boundary: syriaApprovalBoundary,
      signalCounts: {
        critical: riskBuckets.CRITICAL,
        warning: riskBuckets.HIGH,
        info: riskBuckets.LOW,
      },
      regionListingRefDisplayId: regionListingRef?.displayId ?? null,
    });

    const hasPayoutSignal = syriaSignals.some((s) => s.type === "payout_anomaly");
    const syriaGovernanceExplainability = buildSyriaGovernanceExplainabilityLines({
      policyDecision: syriaPolicyPreview.decision,
      reviewType,
      boundary: syriaApprovalBoundary,
      facts: factRecord,
      hasPayoutSignal,
    });
    const syriaPreviewNotes = [...previewNotes] as readonly string[];

    const explainability = {
      summary: `${syriaPolicyPreview.rationale} Syria region preview (read-only). FSBO detectors stay separate; Syria opportunities reflect Syria signals only. Execution is unavailable for this region in this phase.`,
      notes: [
        ...previewNotes,
        ...syriaStructuredExplain.bullets,
        ...syriaSignalExplainability,
        ...(observation.facts?.detectorsFsboOnlyNote ? [String(observation.facts.detectorsFsboOnlyNote)] : []),
      ] as readonly string[],
    };

    const reasoning = buildPreviewExplanationBundle({
      listingId,
      signals: observation.signals,
      observation,
      opportunities,
      proposedActions: ev.proposedActions,
      policyDecisions: ev.policyDecisions,
    });

    const previewExplanationPayload: ListingPreviewExplanation | undefined =
      engineFlags.autonomyPreviewExplainabilityV1 === true ?
        buildPreviewExplanation({
          listingId,
          metrics: snap.metrics,
          observation,
          signals: observation.signals,
          opportunities,
          proposedActions: ev.proposedActions,
          policyDecisions: ev.policyDecisions,
          syriaStructuredLines: syriaStructuredExplain.structuredLines,
          syriaExplainabilityBullets: syriaStructuredExplain.bullets,
        })
      : undefined;

    return {
      listingId,
      autonomyMode,
      metrics: snap.metrics,
      signals: observation.signals,
      observation,
      opportunities,
      proposedActions: ev.proposedActions,
      policyDecisions: ev.policyDecisions,
      opportunityEvaluations: ev.opportunityEvaluations,
      ...(reasoning.explanation !== null ?
        {
          explanation: reasoning.explanation,
          userSafeReasoningSummary: reasoning.userSafeReasoningSummary,
        }
      : {}),
      ...(previewExplanationPayload !== undefined ? { previewExplanation: previewExplanationPayload } : {}),
      executionResult: {
        status: "DRY_RUN",
        startedAt: builtAt,
        finishedAt: builtAt,
        detail: "Syria preview — DRY_RUN only. No execution or governance path.",
        executedActions: [],
        skippedActions: skippedIds,
        reasons: ["preview mode"],
        metadata: {
          previewMode: true,
          autonomyPreviewRealV1: realPreview,
          mock: snap.metrics === null,
          syriaPreview: true,
          execution_unavailable_for_syria_region: true,
        },
      },
      riskBuckets,
      ...(regionListingRef !== null ? { regionListingRef } : {}),
      previewNotes,
      capabilityNotes,
      executionUnavailableForSyria: true,
      explainability,
      syriaPolicyDecision,
      syriaPreviewNotes,
      syriaGovernanceExplainability,
      syriaSignals,
      syriaOpportunities,
      syriaSignalExplainability,
      syriaPolicyPreview,
      syriaApprovalBoundary,
      syriaStructuredExplainability: syriaStructuredExplain,
      unifiedGovernance,
      combinedRisk: unifiedGovernance.combinedRisk,
      fraudRisk: unifiedGovernance.fraudRisk,
    };
  }

  /** Explicit external source — no cross-region resolver in apps/web (read-only stub). */
  private previewExternalListingPlaceholder(listingId: string): ListingPreviewResponse {
    const builtAt = new Date().toISOString();
    const observation: ObservationSnapshot = {
      id: `preview-external-${listingId || "none"}-${builtAt}`,
      target: { type: "fsbo_listing", id: listingId || null, label: undefined },
      signals: [],
      aggregates: {},
      facts: { preview: true, externalPreview: true, appsWebScopeOnly: true },
      builtAt,
    };
    return {
      listingId,
      autonomyMode: "OFF",
      metrics: null,
      signals: [],
      observation,
      opportunities: [],
      proposedActions: [],
      policyDecisions: [],
      opportunityEvaluations: [],
      executionResult: {
        status: "DRY_RUN",
        startedAt: builtAt,
        finishedAt: builtAt,
        detail:
          "External listing preview is not executed in apps/web — use explicit web (FSBO) or Syria sources for real snapshots.",
        executedActions: [],
        skippedActions: [],
        reasons: ["preview mode"],
        metadata: { previewMode: true, externalPreview: true },
      },
      riskBuckets: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      previewNotes: ["external_listing_preview_not_configured_in_web_app"],
      capabilityNotes: [],
    };
  }

  private syriaPreviewEmpty(
    listingId: string,
    builtAt: string,
    previewNotes: string[],
    capabilityNotes: string[],
    summary: string,
  ): ListingPreviewResponse {
    const observation: ObservationSnapshot = {
      id: `preview-syria-empty-${listingId || "none"}-${builtAt}`,
      target: { type: "syria_listing", id: listingId || null, label: undefined },
      signals: [],
      aggregates: {},
      facts: { preview: true, syriaPreview: true, empty: true },
      builtAt,
    };
    return {
      listingId,
      autonomyMode: "OFF",
      metrics: null,
      signals: [],
      observation,
      opportunities: [],
      proposedActions: [],
      policyDecisions: [],
      opportunityEvaluations: [],
      executionResult: {
        status: "DRY_RUN",
        startedAt: builtAt,
        finishedAt: builtAt,
        detail: summary,
        executedActions: [],
        skippedActions: [],
        reasons: ["preview mode"],
        metadata: {
          previewMode: true,
          syriaPreview: true,
          execution_unavailable_for_syria_region: true,
        },
      },
      riskBuckets: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      previewNotes,
      capabilityNotes,
      executionUnavailableForSyria: true,
      explainability: { summary, notes: previewNotes },
    };
  }

  async runForListing(listingId: string, opts: RunOptions = {}): Promise<AutonomousRun> {
    return this.runEngine("fsbo_listing", listingId, opts, () => buildObservationForListing(listingId));
  }

  async runForLead(leadId: string, opts: RunOptions = {}): Promise<AutonomousRun> {
    return this.runEngine("lead", leadId, opts, () => buildObservationForLead(leadId));
  }

  async runForCampaign(campaignKey: string, opts: RunOptions = {}): Promise<AutonomousRun> {
    return this.runEngine("campaign", campaignKey, opts, () => buildObservationForCampaign(campaignKey));
  }

  async runDryModeForTarget(
    targetType: "fsbo_listing" | "lead" | "campaign",
    targetId: string,
    opts: RunOptions = {},
  ): Promise<AutonomousRun> {
    return this.runEngine(targetType, targetId, { ...opts, dryRun: true }, async () => {
      if (targetType === "fsbo_listing") return buildObservationForListing(targetId);
      if (targetType === "lead") return buildObservationForLead(targetId);
      return buildObservationForCampaign(targetId);
    });
  }

  private async runEngine(
    targetType: "fsbo_listing" | "lead" | "campaign",
    targetId: string,
    opts: RunOptions,
    loadObservation: () => ReturnType<typeof buildObservationForListing>,
  ): Promise<AutonomousRun> {
    if (!engineFlags.autonomousMarketplaceV1 || !autonomyConfig.enabled) {
      throw new Error("Autonomous marketplace engine disabled");
    }

    const mode = opts.mode ?? autonomyConfig.defaultMode;
    const dryRun = opts.dryRun ?? autonomyConfig.defaultDryRun;
    const runId = `run-${randomUUID()}`;

    if (opts.idempotencyKey) {
      const existing = await findRecentRunByIdempotencyKey(opts.idempotencyKey, IDEMPOTENCY_TTL_MS);
      if (existing?.summaryJson && typeof existing.summaryJson === "object") {
        autonomyLog.info("idempotent hit", { key: opts.idempotencyKey, runId: existing.id });
        return existing.summaryJson as unknown as AutonomousRun;
      }
    }

    const observation = await loadObservation();
    if (!observation) {
      throw new Error("Observation unavailable — target not found");
    }

    const detectors =
      opts.detectorIds && opts.detectorIds.length > 0
        ? defaultDetectorRegistry.filter((d) => opts.detectorIds!.includes(d.id))
        : defaultDetectorRegistry;

    const opportunities: Opportunity[] = [];
    for (const d of detectors) {
      try {
        opportunities.push(...d.run(observation));
      } catch (e) {
        autonomyLog.detector("detector failed", { id: d.id, err: String(e) });
      }
    }

    let proposedActions = dedupeActions(opportunities.flatMap((o) => o.proposedActions));
    if (opts.actionTypes?.length) {
      proposedActions = proposedActions.filter((a) => opts.actionTypes!.includes(a.type));
    }

    const traces: AutonomousRun["actions"] = [];
    let blocked = 0;
    let approved = 0;
    let executed = 0;
    let dryRuns = 0;
    let govSkipped = 0;
    let execFailures = 0;
    const warnings: string[] = [];
    const errors: string[] = [];

    const regionCode =
      typeof observation.facts?.platformRegionCode === "string"
        ? String(observation.facts.platformRegionCode)
        : observation.target.type === "syria_listing"
          ? SYRIA_REGION_CODE
          : DEFAULT_PLATFORM_REGION_CODE;

    const listingSource = observation.target.type === "syria_listing" ? "syria" : undefined;

    for (const proposed of proposedActions) {
      try {
        const policyCtx = await buildPolicyContext({
          action: proposed,
          observation,
          autonomyMode: mode,
          createdByUserId: opts.createdByUserId ?? null,
        });
        const policy = evaluateActionPolicy(policyCtx);
        const governance = resolveGovernance({
          action: proposed,
          policy,
          mode,
          dryRunRequested: dryRun,
        });

        if (policy.disposition === "BLOCK") blocked++;
        else approved += 1;

        let execution: ExecutionResult;

        if (engineFlags.controlledExecutionV1) {
          const step = await runControlledExecution({
            ctx: {
              runId,
              dryRun,
              createdByUserId: opts.createdByUserId ?? null,
              regionCode,
              listingSource,
            },
            input: { proposed, policy, governance },
          });
          execution = step.execution;

          if (!step.gate.allowed && governance.disposition !== "DRY_RUN") {
            govSkipped++;
          }
        } else {
          const allowExecute = governance.allowExecution && !dryRun;
          const execOpts = {
            dryRun: dryRun || !allowExecute,
            allowExecute,
          };
          execution = await dispatchExecution(proposed, execOpts);

          if (!allowExecute && governance.disposition !== "DRY_RUN") {
            govSkipped++;
          }
        }

        if (execution.status === "DRY_RUN") dryRuns++;
        if (execution.status === "EXECUTED") executed++;
        if (execution.status === "FAILED") execFailures++;

        try {
          await recordAutonomousMarketplaceGovernanceTimeline({
            proposed,
            policy,
            governance,
            execution,
            actorUserId: opts.createdByUserId ?? null,
          });
        } catch {
          /* timeline must not break engine */
        }

        traces.push({
          proposed,
          policy,
          governance,
          execution,
        });

        for (const w of policy.warnings) {
          warnings.push(`${proposed.id}: ${w.message}`);
        }
      } catch (e) {
        errors.push(`${proposed.id}: ${String(e)}`);
        execFailures++;
      }
    }

    const summary: AutonomousRunSummary = {
      runId,
      target: observation.target,
      autonomyMode: mode,
      dryRun,
      status: errors.length > 0 ? (executed > 0 ? "partial_failure" : "failed") : "completed",
      signalsSummary: buildSignalsSummary(observation.signals),
      opportunitiesFound: opportunities.length,
      actionsProposed: proposedActions.length,
      actionsBlocked: blocked,
      actionsApproved: approved,
      actionsExecuted: executed,
      actionsDryRun: dryRuns,
      warnings,
      errors,
      metrics: {
        policyBlocked: blocked,
        governanceSkipped: govSkipped,
        executorFailures: execFailures,
      },
    };

    const payload: AutonomousRun = {
      summary,
      observation,
      opportunities,
      actions: traces.map((t) => ({
        proposed: t.proposed,
        policy: t.policy,
        governance: t.governance,
        execution: t.execution,
      })),
    };

    try {
      await persistAutonomousRun({
        summary,
        observation,
        opportunities,
        fullPayload: payload,
        traces,
        idempotencyKey: opts.idempotencyKey,
        createdByUserId: opts.createdByUserId ?? null,
      });
    } catch (e) {
      autonomyLog.execution("persist failed", { err: String(e) });
      errors.push(`persist: ${String(e)}`);
    }

    autonomyLog.info("run complete", {
      runId,
      proposed: proposedActions.length,
      executed,
      dryRuns,
    });

    return payload;
  }

  async runScheduledScan(opts: RunOptions = {}): Promise<AutonomousRunSummary> {
    autonomyLog.info("scheduled scan stub — use listing/lead/campaign runners", {});
    return {
      runId: `scan-${randomUUID()}`,
      target: { type: "scan", id: null },
      autonomyMode: opts.mode ?? autonomyConfig.defaultMode,
      dryRun: true,
      status: "completed",
      signalsSummary: {},
      opportunitiesFound: 0,
      actionsProposed: 0,
      actionsBlocked: 0,
      actionsApproved: 0,
      actionsExecuted: 0,
      actionsDryRun: 0,
      warnings: ["Scheduled scan V1 — wire batch listing cursor in follow-up"],
      errors: [],
      metrics: { policyBlocked: 0, governanceSkipped: 0, executorFailures: 0 },
    };
  }
}

export const autonomousMarketplaceEngine = new AutonomousMarketplaceEngine();
