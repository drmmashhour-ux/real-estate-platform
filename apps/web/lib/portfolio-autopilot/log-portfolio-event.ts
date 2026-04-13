import { prisma } from "@/lib/db";

export async function logPortfolioAutopilotEvent(input: {
  ownerUserId: string;
  actionType: string;
  performedByUserId?: string | null;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  explanation?: string;
}) {
  await prisma.intelligenceDecisionLog.create({
    data: {
      hostId: input.ownerUserId,
      userId: input.performedByUserId ?? input.ownerUserId,
      domain: "AUTOPILOT",
      actionType: input.actionType,
      inputPayload: input.inputPayload as object | undefined,
      outputPayload: input.outputPayload as object | undefined,
      explanation: input.explanation,
    },
  });
}
