import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateReputationScore } from "@/lib/reputation/update-reputation-score";

export async function createReputationComplaint(input: {
  entityType: ReputationEntityType;
  entityId: string;
  reportedByUserId: string | null;
  category: string;
  description: string;
}) {
  const cat = input.category.trim();
  const desc = input.description.trim();
  if (!cat || !desc) throw new Error("category and description required");

  const row = await prisma.reputationComplaint.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      reportedByUserId: input.reportedByUserId,
      category: cat.slice(0, 120),
      description: desc.slice(0, 8000),
      status: "open",
    },
  });

  await updateReputationScore(input.entityType, input.entityId);
  return row;
}
