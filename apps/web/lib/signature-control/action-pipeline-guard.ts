import { ActionPipelineStatus, ActionPipelineType } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * When true, every offer draft send must include an executed AI action pipeline id (broker-signed autopilot gate).
 * Does not disable the legacy path when false — brokers may still send after legal artifact approval alone.
 */
export function offerSendRequiresExecutedAutopilotPipeline(): boolean {
  const v = process.env.SIGNATURE_CONTROL_REQUIRE_EXECUTED_PIPELINE_FOR_OFFER_SEND;
  return v === "1" || v?.toLowerCase() === "true";
}

/**
 * Outbound offer dispatch may only proceed with this pipeline after broker signature flow has run (status EXECUTED).
 */
export async function assertExecutedAutopilotPipelineForOfferSend(input: {
  dealId: string;
  autopilotActionPipelineId: string;
}): Promise<void> {
  const id = input.autopilotActionPipelineId.trim();
  if (!id) throw new Error("AUTOPILOT_EXECUTED_PIPELINE_REQUIRED");

  const row = await prisma.actionPipeline.findFirst({
    where: { id, dealId: input.dealId },
    select: { status: true, type: true, aiGenerated: true },
  });
  if (!row) throw new Error("AUTOPILOT_PIPELINE_NOT_FOUND");
  if (row.status !== ActionPipelineStatus.EXECUTED) {
    throw new Error("AUTOPILOT_PIPELINE_NOT_EXECUTED");
  }
  if (!row.aiGenerated) throw new Error("AUTOPILOT_PIPELINE_NOT_AI_PREP");
  if (row.type !== ActionPipelineType.DEAL && row.type !== ActionPipelineType.DOCUMENT) {
    throw new Error("AUTOPILOT_PIPELINE_WRONG_TYPE_FOR_OFFER_SEND");
  }
}

export async function assertOfferSendSignatureGate(input: {
  dealId: string;
  autopilotActionPipelineId?: string | null;
}): Promise<void> {
  const required = offerSendRequiresExecutedAutopilotPipeline();
  const pid = input.autopilotActionPipelineId?.trim() ?? "";
  if (required && !pid) {
    throw new Error("AUTOPILOT_EXECUTED_PIPELINE_REQUIRED");
  }
  if (pid) {
    await assertExecutedAutopilotPipelineForOfferSend({ dealId: input.dealId, autopilotActionPipelineId: pid });
  }
}
