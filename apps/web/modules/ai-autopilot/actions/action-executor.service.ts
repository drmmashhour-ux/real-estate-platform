import type { PlatformAutopilotRiskClass } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mayAutoExecuteLowRisk } from "../policies/autopilot-safety-check.service";
import type { AutopilotMode } from "../ai-autopilot.types";

/**
 * v1: executes only LOW-risk internal bookkeeping (status + audit payload).
 * No Stripe, bookings, fraud enforcement, or public publishes from here.
 */
export async function executeAutopilotActionIfAllowed(opts: {
  actionId: string;
  mode: AutopilotMode;
  risk: PlatformAutopilotRiskClass;
  actorUserId: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (opts.risk !== "LOW") {
    return { ok: false, reason: "Only LOW risk can be executed via autopilot v1 executor stub." };
  }
  if (!mayAutoExecuteLowRisk(opts.risk)) {
    return { ok: false, reason: "FEATURE_AI_AUTOPILOT_SAFE_ACTIONS_V1 is off." };
  }

  await prisma.platformAutopilotAction.update({
    where: { id: opts.actionId },
    data: {
      status: "executed",
      executedBySystem: true,
      executedPayload: {
        stub: true,
        message: "v1 safe executor — no external side-effects; audit trail only.",
        at: new Date().toISOString(),
      },
    },
  });

  await prisma.platformAutopilotDecision.create({
    data: {
      actionId: opts.actionId,
      decisionType: "auto_executed",
      actorUserId: opts.actorUserId,
      actorType: "system",
      notes: { mode: opts.mode },
    },
  });

  return { ok: true };
}
