import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

function normalizeSteps(payload: unknown): Prisma.InputJsonValue {
  if (Array.isArray(payload)) return payload as Prisma.InputJsonValue;
  if (payload && typeof payload === "object") return [payload] as unknown as Prisma.InputJsonValue;
  return [] as unknown as Prisma.InputJsonValue;
}

export async function launchSuggestionWorkflow(suggestionId: string, actorUserId: string) {
  const suggestion = await prisma.lecipmProactiveSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) throw new Error("SUGGESTION_NOT_FOUND");
  if (suggestion.ownerId !== actorUserId) throw new Error("FORBIDDEN");
  if (!suggestion.workflowType) return null;

  const wf = await prisma.aIWorkflow.create({
    data: {
      ownerType: suggestion.ownerType,
      ownerId: suggestion.ownerId,
      type: suggestion.workflowType,
      status: "proposed",
      title: suggestion.title,
      description: suggestion.message,
      requiresApproval: true,
      steps: normalizeSteps(suggestion.workflowPayload),
    },
  });

  await recordAuditEvent({
    actorUserId,
    action: "PROACTIVE_SUGGESTION_WORKFLOW_LAUNCHED",
    payload: { suggestionId, workflowId: wf.id },
  });

  return wf;
}
