import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { isExecutiveAutoActionsEnabled } from "@/src/modules/executive/executiveEnv";

export type SafeActionKey =
  | "lower_broker_assignment_priority"
  | "raise_broker_assignment_priority"
  | "lower_host_assignment_priority"
  | "raise_host_assignment_priority"
  | "internal_admin_notify"
  | "mark_city_manual_review"
  | "mark_listing_manual_review"
  | "mark_manual_review_global"
  | "lower_template_priority_context"
  | "raise_template_priority_context"
  | "enable_low_risk_experiment";

export async function logActionRun(params: {
  actionKey: string;
  recommendationId?: string | null;
  resultStatus: string;
  resultJson?: Prisma.InputJsonValue;
}) {
  await prisma.executiveActionRun.create({
    data: {
      id: randomUUID(),
      actionKey: params.actionKey,
      recommendationId: params.recommendationId ?? undefined,
      resultStatus: params.resultStatus,
      resultJson: params.resultJson ?? undefined,
    },
  });
}

export function getSafeAutoActionsForRecommendation(rec: {
  safeAutoActionKey: string | null;
}): SafeActionKey[] {
  if (!rec.safeAutoActionKey) return [];
  const k = rec.safeAutoActionKey as SafeActionKey;
  const allowed = new Set<string>([
    "lower_broker_assignment_priority",
    "raise_broker_assignment_priority",
    "lower_host_assignment_priority",
    "raise_host_assignment_priority",
    "internal_admin_notify",
    "mark_city_manual_review",
    "mark_listing_manual_review",
    "mark_manual_review_global",
    "lower_template_priority_context",
    "raise_template_priority_context",
    "enable_low_risk_experiment",
  ]);
  return allowed.has(k) ? [k] : [];
}

export async function executeAutoActionByKey(
  actionKey: string,
  payload: Record<string, unknown>,
  recommendationId?: string | null,
  options?: { bypassEnv?: boolean }
): Promise<{ ok: boolean; message: string }> {
  if (!isExecutiveAutoActionsEnabled() && !options?.bypassEnv) {
    await logActionRun({
      actionKey,
      recommendationId,
      resultStatus: "skipped",
      resultJson: { reason: "AI_EXECUTIVE_AUTO_ACTIONS_ENABLED not 1" },
    });
    return { ok: false, message: "auto_actions_disabled" };
  }

  const delta = typeof payload.priorityDelta === "number" ? payload.priorityDelta : 5;

  try {
    switch (actionKey as SafeActionKey) {
      case "lower_broker_assignment_priority": {
        const brokerId = String(payload.brokerId ?? "");
        if (!brokerId) throw new Error("brokerId required");
        await prisma.growthAiAssignmentRule.updateMany({
          where: { brokerId, isActive: true },
          data: { priority: { decrement: delta } },
        });
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "success",
          resultJson: { brokerId, delta: -delta } as Prisma.InputJsonValue,
        });
        return { ok: true, message: "broker_priority_lowered" };
      }
      case "raise_broker_assignment_priority": {
        const brokerId = String(payload.brokerId ?? "");
        if (!brokerId) throw new Error("brokerId required");
        await prisma.growthAiAssignmentRule.updateMany({
          where: { brokerId, isActive: true },
          data: { priority: { increment: delta } },
        });
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "success",
          resultJson: { brokerId, delta } as Prisma.InputJsonValue,
        });
        return { ok: true, message: "broker_priority_raised" };
      }
      case "lower_host_assignment_priority": {
        const hostId = String(payload.hostId ?? "");
        if (!hostId) throw new Error("hostId required");
        await prisma.growthAiAssignmentRule.updateMany({
          where: { hostId, isActive: true },
          data: { priority: { decrement: delta } },
        });
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "success",
          resultJson: { hostId, delta: -delta } as Prisma.InputJsonValue,
        });
        return { ok: true, message: "host_priority_lowered" };
      }
      case "raise_host_assignment_priority": {
        const hostId = String(payload.hostId ?? "");
        if (!hostId) throw new Error("hostId required");
        await prisma.growthAiAssignmentRule.updateMany({
          where: { hostId, isActive: true },
          data: { priority: { increment: delta } },
        });
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "success",
          resultJson: { hostId, delta } as Prisma.InputJsonValue,
        });
        return { ok: true, message: "host_priority_raised" };
      }
      case "enable_low_risk_experiment": {
        const experimentKey = String(payload.experimentKey ?? "");
        if (!experimentKey) throw new Error("experimentKey required");
        await prisma.growthAiRoutingExperiment.updateMany({
          where: { experimentKey, isActive: false },
          data: { isActive: true },
        });
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "success",
          resultJson: { experimentKey } as Prisma.InputJsonValue,
        });
        return { ok: true, message: "experiment_enabled" };
      }
      case "internal_admin_notify":
      case "mark_city_manual_review":
      case "mark_listing_manual_review":
      case "mark_manual_review_global":
      case "lower_template_priority_context":
      case "raise_template_priority_context":
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "success",
          resultJson: { auditOnly: true, payload } as Prisma.InputJsonValue,
        });
        return { ok: true, message: "logged_internal_action" };
      default:
        await logActionRun({
          actionKey,
          recommendationId,
          resultStatus: "skipped",
          resultJson: { reason: "unknown_action" },
        });
        return { ok: false, message: "unknown_action" };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    await logActionRun({
      actionKey,
      recommendationId,
      resultStatus: "failed",
      resultJson: { error: msg },
    });
    return { ok: false, message: msg };
  }
}

export async function executeSafeExecutiveAction(
  recommendationId: string,
  options?: { bypassEnv?: boolean }
): Promise<{ ok: boolean; message: string }> {
  const rec = await prisma.executiveRecommendation.findUnique({ where: { id: recommendationId } });
  if (!rec || !rec.safeAutoActionKey) return { ok: false, message: "no_safe_action" };

  const payload: Record<string, unknown> = {
    brokerId: rec.targetEntityType === "broker" ? rec.targetEntityId : undefined,
    hostId: rec.targetEntityType === "host" ? rec.targetEntityId : undefined,
    city: rec.targetEntityType === "city" ? rec.targetEntityId : undefined,
    listingId: rec.targetEntityType === "listing" ? rec.targetEntityId : undefined,
    templateKey: rec.targetEntityType === "template" ? rec.targetEntityId : undefined,
    title: rec.title,
    summary: rec.summary,
  };

  const mutating = new Set([
    "lower_broker_assignment_priority",
    "raise_broker_assignment_priority",
    "lower_host_assignment_priority",
    "raise_host_assignment_priority",
    "enable_low_risk_experiment",
  ]);

  const r = await executeAutoActionByKey(rec.safeAutoActionKey, payload, recommendationId, options);
  if (r.ok) {
    await prisma.executiveRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: mutating.has(rec.safeAutoActionKey) ? "auto_applied" : "accepted",
        updatedAt: new Date(),
      },
    });
  }
  return r;
}
