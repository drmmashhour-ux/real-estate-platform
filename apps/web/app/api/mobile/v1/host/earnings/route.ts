import { prisma } from "@repo/db";
import { requireMobileUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const appRole = await resolveMobileAppRoleFromRequest(request, user);
    if (appRole === "guest" && user.role !== "ADMIN") {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }
    const listingIds = (
      await prisma.shortTermListing.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      })
    ).map((l) => l.id);
    const bookings = await prisma.booking.findMany({
      where: {
        listingId: { in: listingIds },
        status: { in: ["CONFIRMED", "COMPLETED", "DISPUTED"] },
      },
      select: {
        id: true,
        totalCents: true,
        hostFeeCents: true,
        checkIn: true,
        status: true,
        payment: { select: { hostPayoutCents: true, amountCents: true, platformFeeCents: true } },
      },
      take: 200,
      orderBy: { checkIn: "desc" },
    });
    let grossCents = 0;
    let expectedPayoutCents = 0;
    for (const b of bookings) {
      grossCents += b.totalCents;
      const payout = b.payment?.hostPayoutCents ?? Math.max(0, b.totalCents - b.hostFeeCents);
      expectedPayoutCents += payout;
    }
    return Response.json({
      summary: {
        bookingCount: bookings.length,
        grossBookingValueCents: grossCents,
        estimatedHostPayoutCents: expectedPayoutCents,
        currency: "CAD",
      },
      recentBookings: bookings.slice(0, 20).map((b) => ({
        id: b.id,
        checkIn: b.checkIn.toISOString(),
        status: b.status,
        totalCents: b.totalCents,
        estimatedPayoutCents: b.payment?.hostPayoutCents ?? Math.max(0, b.totalCents - b.hostFeeCents),
      })),
      disclaimer: "Payouts finalize per platform policy and Stripe Connect status. Not tax advice.",
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
