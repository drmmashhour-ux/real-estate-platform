import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Row = { sortAt: Date; source: string; label: string; detail: Record<string, unknown> };

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bookingId = (new URL(request.url).searchParams.get("bookingId") ?? "").trim();
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const orderParam = (new URL(request.url).searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { id: true, listingCode: true, title: true } },
      payment: true,
      review: true,
      bnhubInvoice: true,
      bookingEvents: { orderBy: { createdAt: orderDir } },
      bookingMessages: { orderBy: { createdAt: orderDir }, take: 200 },
      disputes: {
        orderBy: { createdAt: orderDir },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 50 }, evidence: true },
      },
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const rows: Row[] = [];

  rows.push({
    sortAt: booking.createdAt,
    source: "booking",
    label: "Booking created",
    detail: {
      status: booking.status,
      confirmationCode: booking.confirmationCode,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
    },
  });

  if (booking.updatedAt.getTime() !== booking.createdAt.getTime()) {
    rows.push({
      sortAt: booking.updatedAt,
      source: "booking",
      label: "Booking record updated",
      detail: { status: booking.status },
    });
  }

  for (const ev of booking.bookingEvents) {
    rows.push({
      sortAt: ev.createdAt,
      source: "bnhub_booking_event",
      label: `Booking event: ${ev.eventType}`,
      detail: { eventType: ev.eventType, actorId: ev.actorId, payload: ev.payload },
    });
  }

  if (booking.payment) {
    const p = booking.payment;
    rows.push({
      sortAt: p.createdAt,
      source: "payment",
      label: `Payment ${p.status}`,
      detail: {
        amountCents: p.amountCents,
        status: p.status,
        stripePaymentId: p.stripePaymentId,
        hostPayoutReleasedAt: p.hostPayoutReleasedAt?.toISOString() ?? null,
        scheduledHostPayoutAt: p.scheduledHostPayoutAt?.toISOString() ?? null,
      },
    });
    if (p.hostPayoutReleasedAt) {
      rows.push({
        sortAt: p.hostPayoutReleasedAt,
        source: "payment",
        label: "Host payout released",
        detail: { paymentId: p.id },
      });
    }
    if (p.updatedAt.getTime() !== p.createdAt.getTime()) {
      rows.push({
        sortAt: p.updatedAt,
        source: "payment",
        label: "Payment record updated",
        detail: { status: p.status },
      });
    }
  }

  if (booking.bnhubInvoice) {
    const inv = booking.bnhubInvoice;
    rows.push({
      sortAt: inv.issuedAt,
      source: "bnhub_invoice",
      label: "Guest invoice issued",
      detail: {
        totalAmountCents: inv.totalAmountCents,
        paymentStatus: inv.paymentStatus,
        stripeSessionId: inv.stripeSessionId,
      },
    });
  }

  for (const m of booking.bookingMessages) {
    rows.push({
      sortAt: m.createdAt,
      source: "booking_message",
      label: "Booking message",
      detail: { senderId: m.senderId, listingCode: m.listingCode },
    });
  }

  for (const d of booking.disputes) {
    rows.push({
      sortAt: d.createdAt,
      source: "dispute",
      label: `Dispute opened (${d.status})`,
      detail: { disputeId: d.id, claimant: d.claimant, category: d.complaintCategory },
    });
    for (const dm of d.messages) {
      rows.push({
        sortAt: dm.createdAt,
        source: "dispute_message",
        label: "Dispute message",
        detail: { disputeId: d.id, senderId: dm.senderId },
      });
    }
    for (const ev of d.evidence) {
      rows.push({
        sortAt: ev.createdAt,
        source: "dispute_evidence",
        label: "Dispute evidence added",
        detail: { disputeId: d.id, evidenceId: ev.id, uploadedBy: ev.uploadedBy },
      });
    }
    if (d.resolvedAt) {
      rows.push({
        sortAt: d.resolvedAt,
        source: "dispute",
        label: "Dispute resolved",
        detail: {
          disputeId: d.id,
          outcome: d.resolutionOutcome,
          refundCents: d.refundCents,
        },
      });
    }
  }

  if (booking.review) {
    const r = booking.review;
    rows.push({
      sortAt: r.createdAt,
      source: "review",
      label: "Guest review submitted",
      detail: { reviewId: r.id, propertyRating: r.propertyRating },
    });
    if (r.updatedAt.getTime() !== r.createdAt.getTime()) {
      rows.push({
        sortAt: r.updatedAt,
        source: "review",
        label: "Review updated",
        detail: { reviewId: r.id },
      });
    }
  }

  rows.sort((a, b) =>
    orderDir === "desc" ? b.sortAt.getTime() - a.sortAt.getTime() : a.sortAt.getTime() - b.sortAt.getTime()
  );

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      confirmationCode: booking.confirmationCode,
      guestId: booking.guestId,
      listing: booking.listing,
    },
    order: orderDir,
    timeline: rows.map((r) => ({ ...r, sortAt: r.sortAt.toISOString() })),
  });
}
