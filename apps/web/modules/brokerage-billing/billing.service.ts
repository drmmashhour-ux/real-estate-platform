import { prisma } from "@/lib/db";

export async function listInvoicesForOffice(officeId: string, take = 80) {
  return prisma.officeInvoice.findMany({
    where: { officeId },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      broker: { select: { id: true, name: true, email: true } },
      deal: { select: { id: true, dealCode: true } },
    },
  });
}
