import { prisma } from "@/lib/db";

export async function incrementSelection(ruleWeightId: string) {
  if (!ruleWeightId) return;

  await prisma.autonomyRuleWeight.update({
    where: { id: ruleWeightId },
    data: {
      selectionCount: {
        increment: 1,
      },
    },
  });
}
