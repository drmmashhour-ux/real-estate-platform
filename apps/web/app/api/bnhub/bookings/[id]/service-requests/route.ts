import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { listGuestVisibleListingServices } from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

async function loadBookingActors(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listingId: true,
      listing: { select: { ownerId: true } },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: bookingId } = await params;
  const b = await loadBookingActors(bookingId);
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });
  const isGuest = b.guestId === userId;
  const isHost = b.listing.ownerId === userId;
  if (!isGuest && !isHost) return Response.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.bnhubServiceRequest.findMany({
    where: { bookingId },
    include: { service: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ requests });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: bookingId } = await params;
  const b = await loadBookingActors(bookingId);
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });
  if (b.guestId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { serviceId?: string; message?: string };
  if (!body.serviceId || !body.message?.trim()) {
    return Response.json({ error: "serviceId and message required" }, { status: 400 });
  }

  const visible = await listGuestVisibleListingServices(b.listingId);
  const allowed = visible.some((o) => o.serviceId === body.serviceId);
  if (!allowed) {
    return Response.json({ error: "Service not offered on this listing" }, { status: 400 });
  }

  const created = await prisma.bnhubServiceRequest.create({
    data: {
      bookingId,
      listingId: b.listingId,
      serviceId: body.serviceId,
      guestUserId: userId,
      hostUserId: b.listing.ownerId,
      message: body.message.trim(),
    },
    include: { service: true },
  });
  return Response.json({ request: created });
}
