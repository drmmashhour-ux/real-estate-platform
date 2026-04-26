import { BookingStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMobileUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

const EXCLUDED_CAL_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.DECLINED,
];

export const dynamic = "force-dynamic";

/** Host calendar: reservations across all owned listings (channel-manager-ready shape). */
export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const appRole = await resolveMobileAppRoleFromRequest(request, user);
    if (appRole === "guest" && user.role !== "ADMIN") {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId")?.trim();

    const listings = await prisma.shortTermListing.findMany({
      where: { ownerId: user.id, ...(listingId ? { id: listingId } : {}) },
      select: { id: true, title: true, listingCode: true },
    });
    const ids = listings.map((l) => l.id);
    const bookings = await prisma.booking.findMany({
      where: { listingId: { in: ids }, status: { notIn: EXCLUDED_CAL_STATUSES } },
      orderBy: { checkIn: "asc" },
      take: 200,
      select: {
        id: true,
        listingId: true,
        checkIn: true,
        checkOut: true,
        status: true,
        nights: true,
        guestId: true,
        confirmationCode: true,
      },
    });
    const blocks = await prisma.availabilitySlot.findMany({
      where: { listingId: { in: ids }, dayStatus: "BLOCKED" },
      select: { listingId: true, date: true },
      take: 500,
    });

    return Response.json({
      listings,
      reservations: bookings.map((b) => ({
        ...b,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        source: "BNHUB_LOCAL" as const,
      })),
      blockedDays: blocks.map((s) => ({
        listingId: s.listingId,
        date: s.date.toISOString(),
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
