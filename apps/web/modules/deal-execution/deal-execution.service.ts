import type { LecipmExecutionPipelineState } from "@prisma/client";
import { prisma } from "@/lib/db";
import { countOpenConditions } from "./condition-tracker.service";
import { getExecutionStatus } from "@/modules/execution/execution.service";
import { getLatestSignatureSummary } from "@/modules/signature/signature-tracking.service";

export async function getDealExecutionOverview(dealId: string) {
  const [exec, openConditions, sig] = await Promise.all([
    getExecutionStatus(dealId),
    countOpenConditions(dealId),
    getLatestSignatureSummary(dealId),
  ]);
  return {
    execution: exec,
    openConditionsCount: openConditions,
    signature: sig,
    disclaimer:
      "LECIPM coordinates tasks and reminders — brokers remain responsible for OACIQ-compliant execution with authorized tools.",
  };
}

export async function syncPipelineAfterSignature(dealId: string) {
  const sig = await getLatestSignatureSummary(dealId);
  if (!sig) return;
  let next: LecipmExecutionPipelineState = "awaiting_signature";
  if (sig.participantCount > 0 && sig.signedCount > 0 && sig.signedCount < sig.participantCount) {
    next = "partially_signed";
  } else if (sig.participantCount > 0 && sig.signedCount >= sig.participantCount) {
    next = "fully_signed";
  }
  await prisma.deal.update({
    where: { id: dealId },
    data: { lecipmExecutionPipelineState: next },
  });
}
