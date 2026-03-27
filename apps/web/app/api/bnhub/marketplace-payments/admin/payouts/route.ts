/**
 * GET — admin payout overview.
 */

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getAdminPayoutOverview } from "@/modules/bnhub-payments/services/payoutControlService";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await getAdminPayoutOverview();
  return Response.json({
    count: rows.length,
    payouts: rows.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      host: p.host,
      confirmationCode: p.booking.confirmationCode,
      payoutStatus: p.payoutStatus,
      grossAmountCents: p.grossAmountCents,
      netAmountCents: p.netAmountCents,
      currency: p.currency,
      eligibleReleaseAt: p.eligibleReleaseAt,
      releaseReason: p.releaseReason,
    })),
  });
}
