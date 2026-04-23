/**
 * Loads persisted posture + combines with matrix for a single policy decision.
 */
import { prisma } from "@/lib/db";

import { getGlobalAutopilotPause } from "./autopilot-global-pause.service";
import {
  assertKnownDomain,
  getDomainMatrixRow,
  normalizePersistedMode,
} from "./autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "./autopilot-domain-matrix.types";
import type { KillSwitchPosition } from "./autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "./autopilot-domain-matrix.types";
import {
  evaluateAutopilotPolicy,
  type AutopilotPolicyDecision,
} from "./full-autopilot-policy.service";
import { buildAutopilotExplanation, type AutopilotExplanationPayload } from "./full-autopilot-explainability.service";

export type FullAutopilotDecisionPayload = AutopilotPolicyDecision &
  AutopilotExplanationPayload & {
    domain: LecipmAutopilotDomainId;
    actionType: string;
    effectiveMode: FullAutopilotMode;
    killSwitch: KillSwitchPosition;
    globalPaused: boolean;
    policyContext?: Record<string, unknown>;
  };

async function loadDomainPosture(domain: LecipmAutopilotDomainId): Promise<{
  effectiveMode: FullAutopilotMode;
  killSwitch: KillSwitchPosition;
}> {
  const row = await prisma.lecipmFullAutopilotDomainConfig.findUnique({
    where: { domainId: domain },
  });
  const matrix = getDomainMatrixRow(domain);
  const defaultMode = matrix?.defaultMode ?? "ASSIST";

  const mode = normalizePersistedMode(row?.mode ?? defaultMode);
  const ks = (row?.killSwitch ?? "ON") as KillSwitchPosition;
  return {
    effectiveMode: mode,
    killSwitch: ks === "OFF" || ks === "LIMITED" || ks === "ON" ? ks : "ON",
  };
}

export async function getAutopilotDecision(params: {
  domain: string;
  actionType: string;
  context?: Record<string, unknown>;
}): Promise<FullAutopilotDecisionPayload | { error: string }> {
  if (!assertKnownDomain(params.domain)) {
    return { error: "unknown_domain" };
  }
  const domain = params.domain;
  const matrix = getDomainMatrixRow(domain);
  if (!matrix) return { error: "unknown_domain" };

  const globalPause = await getGlobalAutopilotPause();
  const globalPaused = globalPause.paused;
  const posture = await loadDomainPosture(domain);

  const policyDecision = evaluateAutopilotPolicy({
    domain,
    actionType: params.actionType,
    matrix,
    effectiveMode: posture.effectiveMode,
    killSwitch: posture.killSwitch,
    globalPaused,
    context: params.context,
  });

  const explanation = buildAutopilotExplanation(domain, params.actionType, policyDecision);

  return {
    ...policyDecision,
    ...explanation,
    domain,
    actionType: params.actionType,
    effectiveMode: posture.effectiveMode,
    killSwitch: posture.killSwitch,
    globalPaused,
    policyContext: params.context,
  };
}

export async function canAutopilotExecute(
  domain: string,
  actionType: string,
  context?: Record<string, unknown>
): Promise<boolean> {
  const d = await getAutopilotDecision({ domain, actionType, context });
  if ("error" in d) return false;
  return d.outcome === "ALLOW_AUTOMATIC";
}
