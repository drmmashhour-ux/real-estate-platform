import { logOpsCorrelation } from "../../lib/monitoring/ops-log";
import { decideFromFailureSignal } from "../../lib/system-brain/decision-engine";
import { classifyFailure } from "./classify-failure";
import { captureFailureContext, type CaptureFailureInput } from "./capture-context";
import { buildMarkdownReport, logFailureToConsole, writeFailureArtifacts } from "./build-failure-report";
import { isRerunRecommendedForFailureType } from "./rerun-scenario";
import { suggestFixForType } from "./suggest-fix";
import type { E2EFailureRecord } from "./types";

export function buildFailureRecord(input: CaptureFailureInput): E2EFailureRecord {
  const context = captureFailureContext(input);
  const { type, severity } = classifyFailure(context);
  const plan = suggestFixForType(type, context.errorMessage);
  const rerunRecommended = isRerunRecommendedForFailureType(type);

  return {
    type,
    severity,
    context,
    likelyRootCause: plan.likelyRootCause,
    suggestedFixZones: plan.suggestedFixZones,
    filesLikelyInvolved: plan.filesLikelyInvolved,
    safeRerunConditions: plan.safeRerunConditions,
    rerunRecommended,
  };
}

export function processScenarioFailure(input: CaptureFailureInput): E2EFailureRecord {
  const record = buildFailureRecord(input);
  const brain = decideFromFailureSignal(record.type);
  logFailureToConsole(record);
  writeFailureArtifacts(record);
  logOpsCorrelation({
    kind: "e2e_scenario_failure",
    scenarioId: record.context.scenarioId,
    scenarioSlug: record.context.scenarioSlug,
    stepName: record.context.stepName,
    failureType: record.type,
    severity: record.severity,
    locale: record.context.locale,
    market: record.context.market,
    role: record.context.role,
    bookingId: record.context.bookingId,
    listingId: record.context.listingId,
    apiStatusCode: record.context.apiStatusCode,
    brainAction: brain.action,
    brainRisk: brain.risk,
    brainAutomationEligible: brain.automationEligible,
  });
  return record;
}

export function processScenarioFailureMarkdownOnly(input: CaptureFailureInput): string {
  const record = buildFailureRecord(input);
  return buildMarkdownReport(record);
}

