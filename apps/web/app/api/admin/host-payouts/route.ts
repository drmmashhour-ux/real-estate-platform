import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** BNHUB guest payment rows — host payout scheduling & holds. */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const bucket = (searchParams.get("bucket") ?? "pending").trim();

  const base = {
    status: "COMPLETED" as const,
  };

  const where =
    bucket === "completed"
      ? { ...base, hostPayoutReleasedAt: { not: null } }
      : bucket === "scheduled"
        ? {
            ...base,
            hostPayoutReleasedAt: null,
            scheduledHostPayoutAt: { not: null },
            payoutHoldReason: null,
          }
        : {
            ...base,
            hostPayoutReleasedAt: null,
          };

  const rows = await prisma.payment.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      bookingId: true,
      amountCents: true,
      platformFeeCents: true,
      hostPayoutCents: true,
      hostPayoutReleasedAt: true,
      scheduledHostPayoutAt: true,
      payoutHoldReason: true,
      linkedContractId: true,
      linkedContractType: true,
      updatedAt: true,
      booking: {
        select: {
          checkIn: true,
          guest: { select: { email: true } },
          listing: { select: { title: true, id: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: rows });
}

export async function PATCH(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { paymentId?: unknown; action?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
  const action = typeof body.action === "string" ? body.action.trim() : "";
  if (!paymentId || !action) {
    return NextResponse.json({ error: "paymentId and action required" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.slice(0, 500) : "";

  if (action === "release") {
    const row = await prisma.payment.update({
      where: { id: paymentId },
      data: { hostPayoutReleasedAt: new Date(), payoutHoldReason: null },
    });
    return NextResponse.json({ ok: true, payment: row });
  }
  if (action === "block") {
    const row = await prisma.payment.update({
      where: { id: paymentId },
      data: { payoutHoldReason: note ? `admin_hold:${note}` : "admin_hold" },
    });
    return NextResponse.json({ ok: true, payment: row });
  }
  if (action === "delay") {
    const row = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        scheduledHostPayoutAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        payoutHoldReason: note ? `admin_delay:${note}` : "admin_delay",
      },
    });
    return NextResponse.json({ ok: true, payment: row });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
