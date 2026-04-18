import { randomUUID } from "crypto";
import { engineFlags } from "@/config/feature-flags";
import { autonomyConfig } from "../config/autonomy.config";
import { defaultDetectorRegistry } from "../detectors/detector-registry";
import { resolveGovernance } from "../governance/governance-resolver";
import { autonomyLog } from "../internal/autonomy-log";
import { evaluateActionPolicy, evaluateListingPreviewPolicy } from "../policy/policy-engine";
import { persistAutonomousRun } from "../persistence/autonomy-repository";
import { runPreviewDetectors } from "../detectors/preview-detector-registry";
import {
  buildListingObservationSnapshot,
  buildObservationForCampaign,
  buildObservationForLead,
  buildObservationForListing,
} from "../signals/observation-builder";
import { buildSyriaListingObservationSnapshot } from "@/modules/integrations/regions/syria/syria-preview-adapter.service";
import { buildSyriaOpportunities } from "@/modules/integrations/regions/syria/syria-opportunity-builder.service";
import { buildSyriaPreviewNoteLines } from "@/modules/integrations/regions/syria/syria-preview-notes.service";
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
import type {
  AutonomyMode,
  AutonomousRun,
  AutonomousRunSummary,
  ExecutionResult,
  ObservationSnapshot,
  Opportunity,
  ProposedAction,
} from "../types/domain.types";
import { buildSignalsSummary } from "../signals/signal-normalizer";
import { buildPolicyContext } from "./policy-context-builder";
import { findRecentRunByIdempotencyKey } from "./idempotency.service";
import { applyControlledAction } from "./action-application.service";
import { requestActionApproval } from "./action-approval.service";
import { dispatchExecution } from "./action-dispatch";
import {
  recordExecutionAttempt,
  recordExecutionDecision,
  recordExecutionOutcome,
} from "./execution-audit.service";
import { verifyActionOutcome } from "./execution-verification.service";
import { rollbackControlledAction } from "./rollback.service";
import { evaluateSafeExecutionGate } from "./safe-execution-gate.service";

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

export class AutonomousMarketplaceEngine {
  /**
   * Preview-only: read-only metrics + observation snapshot, then `previewDetectorRegistry`.
   * - `string` / `{ source: web }` → FSBO path.
   * - `{ source: "syria" }` → Syria read-adapter path (DRY_RUN only; no execution).
   */
  async previewForListing(listingIdOrInput: string | PreviewListingInput): Promise<ListingPreviewResponse> {
    if (typeof listingIdOrInput === "string") {
      return this.previewForWebFsboListing(listingIdOrInput.trim());
    }
    const rawId = typeof listingIdOrInput.listingId === "string" ? listingIdOrInput.listingId.trim() : "";
    if (listingIdOrInput.source === "syria") {
      return this.previewForSyriaListing(rawId);
    }
    return this.previewForWebFsboListing(rawId);
  }

  private async buildPreviewEvaluations(
    observation: ObservationSnapshot,
    opportunities: Opportunity[],
    autonomyMode: AutonomyMode,
  ): Promise<{
    proposedActions: ProposedAction[];
    policyDecisions: ListingPreviewResponse["policyDecisions"];
    opportunityEvaluations: ListingPreviewOpportunityEvaluation[];
  }> {
    const proposedActions = opportunities.flatMap((o) => o.proposedActions);
    const opportunityEvaluations: ListingPreviewOpportunityEvaluation[] = [];
    const policyDecisions: ListingPreviewResponse["policyDecisions"] = [];

    for (const opp of opportunities) {
      const actions: ListingPreviewOpportunityEvaluation["actions"] = [];
      for (const action of opp.proposedActions) {
        const policyCtx = await buildPolicyContext({
          action,
          observation,
          autonomyMode,
        });
        const policy = evaluateListingPreviewPolicy(policyCtx);
        actions.push({ proposedAction: action, policy });
        policyDecisions.push(policy);
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

    const [metrics, observationForDetectors] = await Promise.all([
      buildListingObservationSnapshot(listingId),
      buildObservationForListing(listingId),
    ]);

    const opportunities = observationForDetectors ? runPreviewDetectors(observationForDetectors) : [];

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

    const ev = await this.buildPreviewEvaluations(observation, opportunities, autonomyMode);
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

    return {
      listingId,
      autonomyMode,
      metrics,
      observation,
      opportunities,
      proposedActions: ev.proposedActions,
      policyDecisions: ev.policyDecisions,
      opportunityEvaluations: ev.opportunityEvaluations,
      executionResult: {
        status: "DRY_RUN",
        startedAt: builtAt,
        finishedAt: builtAt,
        detail: "Preview only — no execution performed.",
        metadata: { mock: true },
      },
      riskBuckets: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      },
      ...(regionListingRef !== null ? { regionListingRef } : {}),
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

    const observationForDetectors = snap.observation;
    const opportunities = observationForDetectors ? runPreviewDetectors(observationForDetectors) : [];

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
    const syriaPolicyPreview = evaluateSyriaPreviewPolicyFromSignals(syriaSignals);

    previewNotes.length = 0;
    previewNotes.push(
      ...buildSyriaPreviewNoteLines([...capabilityNotes, ...snap.availabilityNotes], syriaSignals, syriaPolicyPreview),
    );

    const ev = await this.buildPreviewEvaluations(observation, opportunities, autonomyMode);

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

    const explainability = {
      summary: `${syriaPolicyPreview.rationale} Syria region preview (read-only). FSBO detectors stay separate; Syria opportunities reflect Syria signals only. Execution is unavailable for this region in this phase.`,
      notes: [
        ...previewNotes,
        ...syriaSignalExplainability,
        ...(observation.facts?.detectorsFsboOnlyNote ? [String(observation.facts.detectorsFsboOnlyNote)] : []),
      ] as readonly string[],
    };

    return {
      listingId,
      autonomyMode,
      metrics: snap.metrics,
      observation,
      opportunities,
      proposedActions: ev.proposedActions,
      policyDecisions: ev.policyDecisions,
      opportunityEvaluations: ev.opportunityEvaluations,
      executionResult: {
        status: "DRY_RUN",
        startedAt: builtAt,
        finishedAt: builtAt,
        detail: "Syria preview — DRY_RUN only. No execution or governance path.",
        metadata: {
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
      syriaSignals,
      syriaOpportunities,
      syriaSignalExplainability,
      syriaPolicyPreview,
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
        metadata: { syriaPreview: true, execution_unavailable_for_syria_region: true },
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

    for (const proposed of proposedActions) {
      try {
        const policyCtx = await buildPolicyContext({
          action: proposed,
          observation,
          autonomyMode: mode,
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
          await recordExecutionAttempt({
            runId,
            actionId: proposed.id,
            actionType: proposed.type,
            actorUserId: opts.createdByUserId ?? null,
          });

          const gate = evaluateSafeExecutionGate({
            policy,
            governance,
            compliance: { blocked: false },
            legalRisk: { score: 0 },
            trust: { tags: [] },
            runDryRun: dryRun,
            actionTypeEnabledInConfig: autonomyConfig.actionExecutionAllowed[proposed.type] === true,
          });

          await recordExecutionDecision({
            runId,
            actionId: proposed.id,
            dispositionSummary: `${policy.disposition}/${governance.disposition}`,
            gateAllowed: gate.allowed,
            actorUserId: opts.createdByUserId ?? null,
          });

          if (gate.requiresApproval && engineFlags.autonomyApprovalsV1) {
            const appr = await requestActionApproval({
              runId,
              proposed,
              policy,
              governance,
              requestedByUserId: opts.createdByUserId ?? null,
            });
            const now = new Date().toISOString();
            if (appr.ok) {
              execution = {
                status: "REQUIRES_APPROVAL",
                startedAt: now,
                finishedAt: now,
                detail: "Pending human approval",
                metadata: {
                  approvalRequestId: appr.id,
                },
              };
            } else {
              execution = await dispatchExecution(proposed, { dryRun: true, allowExecute: false });
              execution = {
                ...execution,
                metadata: {
                  ...execution.metadata,
                  approvalEnqueueFailed: appr.error,
                },
              };
            }
          } else if (gate.requiresApproval && !engineFlags.autonomyApprovalsV1) {
            execution = await dispatchExecution(proposed, { dryRun: true, allowExecute: false });
          } else if (gate.allowed) {
            const app = await applyControlledAction({ proposed, gate });
            execution =
              app.executionResult ??
              ({
                status: "FAILED",
                startedAt: new Date().toISOString(),
                finishedAt: new Date().toISOString(),
                detail: app.errorMessage ?? "applyControlledAction returned no execution",
                metadata: {},
              } satisfies ExecutionResult);
            if (
              engineFlags.autopilotHardeningV1 &&
              app.executionResult &&
              app.executionResult.status === "EXECUTED"
            ) {
              const v = verifyActionOutcome({ proposed, execution: app.executionResult });
              if (!v.verified && v.reversible) {
                await rollbackControlledAction({
                  runId,
                  proposed,
                  execution: app.executionResult,
                  actorUserId: opts.createdByUserId ?? null,
                });
              }
            }
          } else {
            execution = await dispatchExecution(proposed, { dryRun: true, allowExecute: false });
          }

          await recordExecutionOutcome({
            runId,
            actionId: proposed.id,
            executionStatus: execution.status,
            actorUserId: opts.createdByUserId ?? null,
          });

          if (!gate.allowed && governance.disposition !== "DRY_RUN") {
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
