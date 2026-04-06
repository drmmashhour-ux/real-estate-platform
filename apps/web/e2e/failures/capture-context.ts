import type { ScenarioContext, ScenarioResult } from "../scenarios/_context";
import type { E2EFailureContext, E2ELocale, E2ERole } from "./types";

export type CaptureFailureInput = {
  scenarioId: number;
  scenarioSlug: string;
  scenarioDisplayName: string;
  result: ScenarioResult;
  ctx: ScenarioContext;
  lastStepOverride?: string;
  stackTrace?: string | null;
};

function pickLocale(state: ScenarioContext["state"]): E2ELocale {
  const c = state.activeLocale;
  if (c === "fr" || c === "ar" || c === "en") return c;
  return "en";
}

function pickRole(state: ScenarioContext["state"]): E2ERole {
  const r = state.activeRole;
  if (r === "guest" || r === "host" || r === "admin") return r;
  return "guest";
}

function firstFailedStep(result: ScenarioResult): string {
  if (result.failedSteps.length > 0) return result.failedSteps[0]!;
  if (result.detail) return result.detail.slice(0, 200);
  return "unknown_step";
}

/**
 * Builds structured context from Playwright scenario result + shared mutable state.
 * Scenarios may set `state.activeLocale`, `state.lastStepName`, etc. via `setE2eDiagnosticContext`.
 */
export function captureFailureContext(input: CaptureFailureInput): E2EFailureContext {
  const { scenarioId, scenarioSlug, scenarioDisplayName, result, ctx, lastStepOverride, stackTrace } = input;
  const { state } = ctx;
  const stepName = lastStepOverride ?? state.lastStepName ?? firstFailedStep(result);

  return {
    scenarioName: scenarioDisplayName,
    scenarioSlug,
    scenarioId,
    stepName,
    locale: pickLocale(state),
    market: state.activeMarket ?? "unknown",
    role: pickRole(state),
    route: state.lastRoute ?? null,
    bookingId: state.lastBookingId ?? null,
    listingId: state.lastListingId ?? null,
    paymentMode: state.paymentMode ?? null,
    bookingStatus: state.lastBookingStatus ?? null,
    manualPaymentStatus: state.lastManualPaymentStatus ?? null,
    apiStatusCode: state.lastApiStatus ?? null,
    apiBodySnippet: state.lastApiBodySnippet ?? null,
    errorMessage: [result.detail, ...result.failedSteps, ...result.criticalBugs].filter(Boolean).join(" | "),
    logSnippet: state.lastLogSnippet ?? null,
    stackTrace: stackTrace ?? state.lastStackTrace ?? null,
    timestamp: new Date().toISOString(),
  };
}
