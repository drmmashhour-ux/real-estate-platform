import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { completeBooking } from "@/lib/bnhub/booking";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

function isPaidBooking(b: {
  status: BookingStatus;
  payment: { status: PaymentStatus } | null;
}) {
  const payOk = b.payment?.status === PaymentStatus.COMPLETED;
  return payOk && (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const action = typeof body.action === "string" ? body.action.trim() : "";

    const b = await prisma.booking.findFirst({
      where: { id, guestId: user.id },
      select: {
        id: true,
        status: true,
        checkOut: true,
        checkedInAt: true,
        checkedOutAt: true,
        payment: { select: { status: true } },
      },
    });
    if (!b) return Response.json({ error: "Not found" }, { status: 404 });

    if (action === "complete_stay") {
      if (b.status === BookingStatus.COMPLETED) {
        return Response.json({ ok: true, status: BookingStatus.COMPLETED });
      }
      if (!isPaidBooking(b)) {
        return Response.json({ error: "Complete stay requires a paid booking" }, { status: 403 });
      }
      const now = new Date();
      if (now < b.checkOut) {
        return Response.json(
          { error: "You can mark the stay complete after the checkout date" },
          { status: 400 }
        );
      }
      await completeBooking(id);
      return Response.json({ ok: true, status: BookingStatus.COMPLETED });
    }

    if (!isPaidBooking(b)) {
      return Response.json({ error: "Not available until payment is confirmed" }, { status: 403 });
    }

    if (action === "check_in") {
      if (b.checkedInAt) {
        return Response.json({ ok: true, checkedInAt: b.checkedInAt.toISOString() });
      }
      const updated = await prisma.booking.update({
        where: { id },
        data: { checkedInAt: new Date() },
        select: { checkedInAt: true },
      });
      return Response.json({ ok: true, checkedInAt: updated.checkedInAt?.toISOString() ?? null });
    }

    if (action === "check_out") {
      if (!b.checkedInAt) {
        return Response.json({ error: "Confirm check-in first" }, { status: 400 });
      }
      if (b.checkedOutAt) {
        return Response.json({ ok: true, checkedOutAt: b.checkedOutAt.toISOString() });
      }
      const updated = await prisma.booking.update({
        where: { id },
        data: { checkedOutAt: new Date() },
        select: { checkedOutAt: true },
      });
      return Response.json({ ok: true, checkedOutAt: updated.checkedOutAt?.toISOString() ?? null });
    }

    return Response.json({ error: "Unknown action — use check_in | check_out | complete_stay" }, { status: 400 });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
