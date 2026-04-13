import { DealRequestItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requestCompletenessPercent } from "./request-completeness.service";
import type { ItemValidationOutcome } from "./intake-validation.types";

export async function summarizeIntakeValidation(requestId: string): Promise<{
  completeness: number;
  outcome: ItemValidationOutcome;
}> {
  const completeness = await requestCompletenessPercent(requestId);
  const req = await prisma.dealRequest.findUnique({
    where: { id: requestId },
    include: { items: true },
  });
  if (!req) {
    return { completeness: 0, outcome: "invalid" };
  }
  const anyRejected = req.items.some((i) => i.status === DealRequestItemStatus.REJECTED);
  if (anyRejected) return { completeness, outcome: "invalid" };
  if (completeness >= 100) return { completeness, outcome: "fulfilled" };
  const anyReceived = req.items.some((i) => i.status === DealRequestItemStatus.RECEIVED);
  if (anyReceived) return { completeness, outcome: "broker_review_required" };
  return { completeness, outcome: "partial" };
}
