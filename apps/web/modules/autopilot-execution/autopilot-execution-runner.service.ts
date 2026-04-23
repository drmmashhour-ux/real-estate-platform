/**
 * Executes an allowed candidate (bounded). Heavy side-effects stay in domain workers — v1 echoes payload.
 * Feature flag `LECIPM_AUTOPILOT_EXECUTE` gates real mutations (default conservative).
 */
import type { PlatformAutopilotRiskClass } from "@prisma/client";

import { prisma } from "@/lib/db";

function riskToPlatformClass(risk: string): PlatformAutopilotRiskClass {
  if (risk === "LOW") return "LOW";
  if (risk === "MEDIUM") return "MEDIUM";
  if (risk === "HIGH") return "HIGH";
  return "CRITICAL";
}

export async function persistAutomaticExecution(params: {
  domain: string;
  actionType: string;
  title: string;
  summary: string;
  candidatePayload: unknown;
  riskLevel: string;
  fingerprint?: string;
  subjectUserId?: string | null;
}) {
  const executedPayload =
    process.env.LECIPM_AUTOPILOT_EXECUTE === "true" ?
      params.candidatePayload
    : {
        simulated: true,
        note: "Set LECIPM_AUTOPILOT_EXECUTE=true to attach real downstream mutations (additive rollout).",
        mirrored: params.candidatePayload,
      };

  const pa = await prisma.platformAutopilotAction.create({
    data: {
      domain: params.domain,
      entityType: "lecipm_full_autopilot",
      entityId: params.fingerprint ?? null,
      actionType: params.actionType,
      title: params.title.slice(0, 500),
      summary: params.summary.slice(0, 8000),
      severity: "info",
      riskLevel: riskToPlatformClass(params.riskLevel),
      status: "executed",
      recommendedPayload: params.candidatePayload as object | undefined,
      executedPayload: executedPayload as object | undefined,
      fingerprint: params.fingerprint ?? null,
      subjectUserId: params.subjectUserId ?? undefined,
      executedBySystem: true,
      reasons: {
        channel: "lecipm_full_autopilot_v1",
        boundedAuto: true,
      } as object,
    },
  });

  await prisma.platformAutopilotDecision.create({
    data: {
      actionId: pa.id,
      decisionType: "AUTO_EXECUTED",
      actorType: "system",
      notes: { note: "Bounded automatic execution (policy-approved)." } as object,
    },
  });

  return pa.id;
}

export async function persistQueuedApproval(params: {
  domain: string;
  actionType: string;
  title: string;
  summary: string;
  candidatePayload: unknown;
  riskLevel: string;
  fingerprint?: string;
  subjectUserId?: string | null;
}) {
  const pa = await prisma.platformAutopilotAction.create({
    data: {
      domain: params.domain,
      entityType: "lecipm_full_autopilot",
      entityId: params.fingerprint ?? null,
      actionType: params.actionType,
      title: params.title.slice(0, 500),
      summary: params.summary.slice(0, 8000),
      severity: "warning",
      riskLevel: riskToPlatformClass(params.riskLevel),
      status: "pending_approval",
      recommendedPayload: params.candidatePayload as object | undefined,
      fingerprint: params.fingerprint ?? null,
      subjectUserId: params.subjectUserId ?? undefined,
      executedBySystem: false,
      reasons: {
        channel: "lecipm_full_autopilot_v1",
        needsApproval: true,
        suggestedBy: params.sourceSystem ?? "unknown",
      } as object,
    },
  });
  return pa.id;
}
