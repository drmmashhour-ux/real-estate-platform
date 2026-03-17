/**
 * Validate timeline actions (e.g. can advance, can complete step).
 */

import { prisma } from "@/lib/db";

export async function canAdvanceToStage(transactionId: string, newStage: string): Promise<{ allowed: boolean; reason?: string }> {
  const timeline = await prisma.transactionTimeline.findUnique({
    where: { transactionId },
    include: { steps: true },
  });
  if (!timeline) return { allowed: false, reason: "Timeline not found" };
  if (timeline.status === "cancelled") return { allowed: false, reason: "Timeline is cancelled" };
  if (timeline.status === "blocked") return { allowed: false, reason: "Timeline is blocked" };
  return { allowed: true };
}

export async function canCompleteStep(transactionId: string, stepId: string, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const timeline = await prisma.transactionTimeline.findUnique({
    where: { transactionId },
    include: { steps: true, transaction: true },
  });
  if (!timeline) return { allowed: false, reason: "Timeline not found" };
  const step = timeline.steps.find((s) => s.id === stepId);
  if (!step) return { allowed: false, reason: "Step not found" };
  if (step.status === "completed") return { allowed: false, reason: "Step already completed" };
  if (step.status === "cancelled") return { allowed: false, reason: "Step is cancelled" };
  if (timeline.status === "cancelled") return { allowed: false, reason: "Timeline is cancelled" };
  return { allowed: true };
}
