import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/income – list all Canva invoices (admin). Add auth in production.
 */
export async function GET() {
  try {
    const invoices = await prisma.canvaInvoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usage: {
          select: { userId: true, listingId: true, amount: true, createdAt: true },
        },
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const byUser = new Map<string, { userId: string; total: number; count: number }>();
    for (const inv of invoices) {
      const u = byUser.get(inv.userId) ?? { userId: inv.userId, total: 0, count: 0 };
      u.total += inv.amount;
      u.count += 1;
      byUser.set(inv.userId, u);
    }

    return Response.json({
      totalRevenue,
      invoiceCount: invoices.length,
      userCount: byUser.size,
      users: Array.from(byUser.entries()).map(([, data]) => ({ ...data })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        userId: inv.userId,
        usageId: inv.usageId,
        amount: inv.amount,
        createdAt: inv.createdAt,
        invoiceNumber: inv.invoiceNumber,
        listingId: inv.usage?.listingId,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load income" }, { status: 500 });
  }
}
