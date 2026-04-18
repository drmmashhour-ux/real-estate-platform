import { prisma } from "@/lib/db";
import type { QaReviewType } from "@prisma/client";

/** Placeholder routing — v2 can assign by workload / specialty. */
export async function suggestReviewerForDeal(_dealId: string, _reviewType: QaReviewType): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return admin?.id ?? null;
}
