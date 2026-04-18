import { prisma } from "@/lib/db";

export async function billingMetrics(officeId: string, since: Date) {
  const unpaid = await prisma.officeInvoice.count({
    where: {
      officeId,
      status: { in: ["issued", "due", "overdue"] },
      updatedAt: { gte: since },
    },
  });
  const overdue = await prisma.officeInvoice.count({
    where: { officeId, status: "overdue" },
  });
  return { unpaidInvoices: unpaid, overdueInvoices: overdue };
}
