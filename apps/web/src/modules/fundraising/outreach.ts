import { prisma } from "@/lib/db";
import { logInteraction } from "./pipeline";

/** Initial cold/warm outreach log (stored as interaction type `outreach`). */
export async function logOutreachMessage(investorId: string, message: string) {
  return logInteraction(investorId, "outreach", message);
}

/** Record that the investor replied or engaged (type `response`). */
export async function trackResponse(investorId: string, summary: string) {
  return logInteraction(investorId, "response", summary);
}

/**
 * Log a scheduled follow-up touch and optionally set reminder on the investor row.
 */
export async function trackFollowUp(
  investorId: string,
  summary: string,
  nextFollowUpAt?: Date | null
) {
  const row = await logInteraction(investorId, "follow_up", summary);
  if (nextFollowUpAt != null) {
    await prisma.fundraisingInvestor.update({
      where: { id: investorId },
      data: { nextFollowUpAt },
    });
  }
  return row;
}
