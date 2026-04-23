import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/invoices
 * Returns upgrade invoices (design-access, storage plans) for the current user.
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ invoices: [] });
    }
    const list = await prisma.upgradeInvoice.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    return Response.json({
      invoices: list.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        plan: inv.plan,
        date: inv.date,
        createdAt: inv.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ invoices: [] });
  }
}
