import { prisma } from "@/lib/db";

export async function payoutLagDays(officeId: string, since: Date) {
  const paid = await prisma.officePayout.findMany({
    where: { officeId, status: "paid", paidAt: { gte: since } },
    select: { createdAt: true, paidAt: true },
    take: 200,
  });
  if (paid.length === 0) return null;
  let sum = 0;
  for (const p of paid) {
    if (p.paidAt) sum += (p.paidAt.getTime() - p.createdAt.getTime()) / 86400000;
  }
  return Math.round((sum / paid.length) * 10) / 10;
}
