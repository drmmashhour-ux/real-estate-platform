import { prisma } from "@/lib/db";

export async function assertDraftAccess(draftId: string, userId: string) {
  const d = await prisma.legalFormDraft.findUnique({
    where: { id: draftId },
    select: { brokerUserId: true },
  });
  if (!d) return { ok: false as const, status: 404 as const };
  if (d.brokerUserId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return { ok: false as const, status: 403 as const };
    }
  }
  return { ok: true as const };
}

export async function countBlockingAlerts(draftId: string): Promise<number> {
  return prisma.legalFormAlert.count({
    where: { draftId, severity: "blocking" },
  });
}
