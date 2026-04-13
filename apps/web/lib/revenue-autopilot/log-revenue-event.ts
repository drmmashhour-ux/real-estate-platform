import { prisma } from "@/lib/db";

export async function logRevenueAutopilotEvent(input: {
  scopeType: string;
  scopeId: string;
  actionType: string;
  performedByUserId?: string | null;
  hostId?: string | null;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  explanation?: string;
}) {
  await prisma.intelligenceDecisionLog.create({
    data: {
      domain: "AUTOPILOT",
      actionType: `revenue_autopilot:${input.actionType}`,
      hostId: input.hostId ?? undefined,
      userId: input.performedByUserId ?? undefined,
      inputPayload: {
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        ...(input.inputPayload ?? {}),
      } as object,
      outputPayload: input.outputPayload as object | undefined,
      explanation: input.explanation,
    },
  });
}
