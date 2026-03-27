import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { applyGuarantee, getGuaranteesForBooking } from "@/lib/bnhub/bnhub-guarantee";

/** GET /api/bnhub/bookings/:id/guarantee — Guest or host views guarantee rows. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id: bookingId } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    if (booking.guestId !== userId && booking.listing.ownerId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const rows = await getGuaranteesForBooking(bookingId);
    return Response.json({ guarantees: rows });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/bnhub/bookings/:id/guarantee — Idempotent apply (confirmed bookings only).
 * Usually triggered by payment webhook; exposed for recovery / support.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id: bookingId } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    if (booking.guestId !== userId && booking.listing.ownerId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const row = await applyGuarantee(bookingId);
    return Response.json({ guarantee: row });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to apply guarantee" },
      { status: 400 }
    );
  }
}
