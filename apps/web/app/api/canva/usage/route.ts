import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/canva/usage – list current user's Canva usage + trial status + invoices
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ usage: null, invoices: [], trialEndsAt: null });
    }

    const usages = await prisma.canvaDesignUsage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { invoices: true },
    });
    const latestUsage = usages[0] ?? null;
    const allInvoices = usages.flatMap((u) => u.invoices);
    const trialEndsAt = latestUsage?.trialEndsAt ?? null;
    const inTrial = latestUsage && latestUsage.trialEndsAt > new Date() && !latestUsage.isPaid;

    return Response.json({
      usage: latestUsage
        ? {
            id: latestUsage.id,
            listingId: latestUsage.listingId,
            createdAt: latestUsage.createdAt,
            trialEndsAt: latestUsage.trialEndsAt,
            isPaid: latestUsage.isPaid,
            amount: latestUsage.amount,
          }
        : null,
      invoices: allInvoices.map((inv) => ({
        id: inv.id,
        usageId: inv.usageId,
        amount: inv.amount,
        createdAt: inv.createdAt,
        invoiceNumber: inv.invoiceNumber,
      })),
      trialEndsAt: trialEndsAt ? (trialEndsAt as Date).toISOString() : null,
      inTrial: !!inTrial,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
