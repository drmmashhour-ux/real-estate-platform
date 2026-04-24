import { requireUser } from "@/modules/security/access-guard.service";
import { triggerHostPayout } from "@/modules/payouts/payout.service";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/host/finance/payout — trigger payout for a confirmed/completed booking
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

    // Verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { hostId: true } } }
    });

    if (!booking || booking.listing.hostId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await triggerHostPayout(bookingId);
    return NextResponse.json({ ok: true, payout: result });
  } catch (error) {
    console.error("[finance:api] payout failed", error);
    return NextResponse.json({ error: "Payout failed" }, { status: 500 });
  }
}
