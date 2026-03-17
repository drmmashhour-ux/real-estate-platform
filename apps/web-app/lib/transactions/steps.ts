import { prisma } from "@/lib/db";
import { recordTransactionEvent } from "./events";
import type { ClosingStepName } from "./constants";

const DEFAULT_STEPS: ClosingStepName[] = ["inspection", "financing_approval", "legal_review", "final_payment", "ownership_transfer"];

export async function ensureClosingSteps(transactionId: string): Promise<void> {
  const existing = await prisma.transactionStep.count({ where: { transactionId } });
  if (existing > 0) return;

  await prisma.transactionStep.createMany({
    data: DEFAULT_STEPS.map((stepName) => ({
      transactionId,
      stepName,
      status: "pending",
    })),
  });
}

export interface CompleteStepInput {
  transactionId: string;
  stepName: ClosingStepName | string;
  completedById: string;
}

export async function completeStep(input: CompleteStepInput): Promise<void> {
  const step = await prisma.transactionStep.findFirst({
    where: { transactionId: input.transactionId, stepName: input.stepName },
    select: { id: true, status: true, transactionId: true },
  });
  if (!step) throw new Error("Step not found");
  if (step.status === "completed") throw new Error("Step already completed");

  await prisma.transactionStep.update({
    where: { id: step.id },
    data: { status: "completed", completedById: input.completedById, completedAt: new Date() },
  });

  const pending = await prisma.transactionStep.count({
    where: { transactionId: input.transactionId, status: "pending" },
  });
  if (pending === 0) {
    await prisma.realEstateTransaction.update({
      where: { id: input.transactionId },
      data: { status: "completed" },
    });
    await recordTransactionEvent(input.transactionId, "transaction_closed", {}, input.completedById);
  } else {
    await prisma.realEstateTransaction.update({
      where: { id: input.transactionId },
      data: { status: "closing_in_progress" },
    });
    await recordTransactionEvent(input.transactionId, "step_completed", { stepName: input.stepName }, input.completedById);
  }
}
