import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Last run timestamp stored on executionMetadata — no separate table (v1).
 */
export async function touchAutopilotLastRun(dealId: string): Promise<void> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { executionMetadata: true } });
  if (!deal) return;
  const meta =
    deal.executionMetadata && typeof deal.executionMetadata === "object"
      ? ({ ...(deal.executionMetadata as object) } as Record<string, unknown>)
      : {};
  meta.autopilotLastRunAt = new Date().toISOString();
  await prisma.deal.update({
    where: { id: dealId },
    data: { executionMetadata: meta as Prisma.InputJsonValue },
  });
}

export async function getAutopilotLastRunAt(dealId: string): Promise<string | null> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { executionMetadata: true } });
  const meta = deal?.executionMetadata as Record<string, unknown> | null;
  const v = meta?.autopilotLastRunAt;
  return typeof v === "string" ? v : null;
}
