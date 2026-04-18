import { logWarn } from "@/lib/logger";
import type { RankedAction } from "../ai-autopilot.types";
import { prisma } from "@/lib/db";

export type GuardrailResult = { allow: true } | { allow: false; code: string; detail: string };

let lastSessionStats = {
  evaluated: 0,
  rejected: 0,
  byCode: {} as Record<string, number>,
};

export function resetGuardrailSessionStats(): void {
  lastSessionStats = { evaluated: 0, rejected: 0, byCode: {} };
}

export function getLastGuardrailSessionStats(): typeof lastSessionStats {
  return { ...lastSessionStats, byCode: { ...lastSessionStats.byCode } };
}

function bumpReject(code: string): void {
  lastSessionStats.rejected += 1;
  lastSessionStats.byCode[code] = (lastSessionStats.byCode[code] ?? 0) + 1;
}

/**
 * Pre-persist checks: vague copy, missing entity where needed, already-approved fingerprint.
 */
export async function evaluateAutopilotGuardrails(
  action: RankedAction,
  fingerprint: string,
): Promise<GuardrailResult> {
  lastSessionStats.evaluated += 1;

  const title = action.title?.trim() ?? "";
  const summary = action.summary?.trim() ?? "";
  if (title.length < 5) {
    bumpReject("vague_title");
    logWarn("[autopilot:guardrail] rejected vague title", { actionType: action.actionType, titleLen: title.length });
    return { allow: false, code: "vague_title", detail: "Title too short" };
  }
  if (summary.length < 12) {
    bumpReject("vague_summary");
    logWarn("[autopilot:guardrail] rejected vague summary", { actionType: action.actionType });
    return { allow: false, code: "vague_summary", detail: "Summary too short" };
  }
  if (!action.actionType?.trim()) {
    bumpReject("missing_action_type");
    return { allow: false, code: "missing_action_type", detail: "Missing actionType" };
  }

  const needsEntity =
    action.domain === "bnhub" || action.domain === "listing" || action.domain === "broker_deal";
  if (needsEntity && !action.entityId?.trim()) {
    bumpReject("missing_entity");
    logWarn("[autopilot:guardrail] rejected missing entity", { domain: action.domain, actionType: action.actionType });
    return { allow: false, code: "missing_entity", detail: "Entity target required for this domain" };
  }

  if (fingerprint) {
    const approved = await prisma.platformAutopilotAction.findFirst({
      where: { fingerprint, status: "approved" },
      select: { id: true },
    });
    if (approved) {
      bumpReject("fingerprint_already_approved");
      logWarn("[autopilot:guardrail] skip — same fingerprint already approved", { fingerprint: fingerprint.slice(0, 12) });
      return { allow: false, code: "fingerprint_already_approved", detail: "Same issue already approved" };
    }
  }

  const conf = typeof action.confidence === "number" ? action.confidence : 0;
  const keys = action.reasons && typeof action.reasons === "object" ? Object.keys(action.reasons as object).length : 0;
  if (conf < 0.35 && keys < 2) {
    bumpReject("low_evidence");
    logWarn("[autopilot:guardrail] rejected low evidence", { actionType: action.actionType, conf, keys });
    return { allow: false, code: "low_evidence", detail: "Confidence and evidence below threshold" };
  }

  return { allow: true };
}
