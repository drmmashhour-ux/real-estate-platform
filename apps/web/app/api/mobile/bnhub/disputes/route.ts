import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { createDispute } from "@/lib/bnhub/disputes";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";
import { notifyActiveAdmins } from "@/lib/bnhub/notify-admins-mobile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listing: { select: { ownerId: true, title: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isParticipant = booking.guestId === user.id || booking.listing.ownerId === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const disputes = await prisma.dispute.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      complaintCategory: true,
      urgencyLevel: true,
      description: true,
      createdAt: true,
      resolutionNotes: true,
      refundCents: true,
      resolutionOutcome: true,
    },
  });

  return NextResponse.json({
    booking: {
      id: bookingId,
      listingTitle: booking.listing.title,
    },
    disputes: disputes.map((dispute) => ({
      ...dispute,
      createdAt: dispute.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const complaintCategory =
    typeof body?.complaintCategory === "string" ? body.complaintCategory.trim().slice(0, 80) : null;
  const urgencyLevel = typeof body?.urgencyLevel === "string" ? body.urgencyLevel.trim().slice(0, 40) : null;

  if (!bookingId || !description) {
    return NextResponse.json({ error: "bookingId and description required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listing: {
        select: {
          ownerId: true,
          title: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.guestId !== user.id) {
    return NextResponse.json({ error: "Only the guest can submit a mobile issue report" }, { status: 403 });
  }

  const dispute = await createDispute({
    bookingId,
    claimant: "GUEST",
    claimantUserId: user.id,
    description,
    evidenceUrls: [],
  });

  const updated = await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      complaintCategory,
      urgencyLevel,
    },
    select: {
      id: true,
      status: true,
      complaintCategory: true,
      urgencyLevel: true,
      description: true,
      createdAt: true,
    },
  });

  void notifyActiveAdmins({
    title: "New BNHUB dispute",
    message: `Guest opened a dispute on “${booking.listing.title}”.`,
    actionUrl: `/admin/bnhub-disputes/${updated.id}`,
  });

  return NextResponse.json({
    dispute: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}
