import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Row = { sortAt: Date; source: string; label: string; detail: Record<string, unknown> };

/**
 * Admin: chronological activity for a platform user (audit).
 */
export async function GET(request: NextRequest) {
  const adminId = await getGuestId();
  if (!adminId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (new URL(request.url).searchParams.get("userId") ?? "").trim();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const orderParam = (new URL(request.url).searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, userCode: true, createdAt: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [immoAsActor, immoAsTarget, leads, userDeals, guestBookings] = await Promise.all([
    prisma.immoContactLog.findMany({
      where: { userId },
      orderBy: { actionAt: orderDir },
      take: 200,
      select: {
        id: true,
        contactType: true,
        listingId: true,
        actionAt: true,
        hub: true,
        metadata: true,
      },
    }),
    prisma.immoContactLog.findMany({
      where: { targetUserId: userId },
      orderBy: { actionAt: orderDir },
      take: 100,
      select: {
        id: true,
        contactType: true,
        listingId: true,
        actionAt: true,
        userId: true,
        hub: true,
      },
    }),
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: orderDir },
      take: 80,
      select: { id: true, status: true, createdAt: true, contactOrigin: true, fsboListingId: true, listingId: true },
    }),
    prisma.deal.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
      },
      orderBy: { createdAt: orderDir },
      take: 80,
      select: {
        id: true,
        status: true,
        createdAt: true,
        listingCode: true,
        leadId: true,
        buyerId: true,
        sellerId: true,
        brokerId: true,
      },
    }),
    prisma.booking.findMany({
      where: { guestId: userId },
      orderBy: { createdAt: orderDir },
      take: 40,
      select: { id: true, status: true, createdAt: true, confirmationCode: true, listingId: true },
    }),
  ]);

  const rows: Row[] = [];

  rows.push({
    sortAt: user.createdAt,
    source: "user",
    label: "Account created",
    detail: { role: user.role, userCode: user.userCode },
  });

  for (const l of immoAsActor) {
    rows.push({
      sortAt: l.actionAt,
      source: "immo_contact_log",
      label: `ImmoContact (${l.contactType})`,
      detail: { logId: l.id, listingId: l.listingId, hub: l.hub },
    });
  }
  for (const l of immoAsTarget) {
    rows.push({
      sortAt: l.actionAt,
      source: "immo_contact_log",
      label: `ImmoContact — target (${l.contactType})`,
      detail: { logId: l.id, fromUserId: l.userId, listingId: l.listingId },
    });
  }
  for (const lead of leads) {
    rows.push({
      sortAt: lead.createdAt,
      source: "lead",
      label: `Lead (${lead.status})`,
      detail: {
        leadId: lead.id,
        contactOrigin: lead.contactOrigin,
        fsboListingId: lead.fsboListingId,
      },
    });
  }
  for (const d of userDeals) {
    const roles: string[] = [];
    if (d.buyerId === userId) roles.push("buyer");
    if (d.sellerId === userId) roles.push("seller");
    if (d.brokerId === userId) roles.push("broker");
    rows.push({
      sortAt: d.createdAt,
      source: "deal",
      label: `Deal (${d.status}) — ${roles.join("+") || "party"}`,
      detail: { dealId: d.id, listingCode: d.listingCode, leadId: d.leadId, roles },
    });
  }
  for (const b of guestBookings) {
    rows.push({
      sortAt: b.createdAt,
      source: "booking",
      label: `Booking (${b.status})`,
      detail: { bookingId: b.id, code: b.confirmationCode },
    });
  }

  const seen = new Set<string>();
  const deduped: Row[] = [];
  for (const r of rows.sort((a, b) => a.sortAt.getTime() - b.sortAt.getTime())) {
    const k = `${r.source}-${r.label}-${r.sortAt.toISOString()}-${JSON.stringify(r.detail).slice(0, 80)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(r);
  }
  deduped.sort((a, b) =>
    orderDir === "desc" ? b.sortAt.getTime() - a.sortAt.getTime() : a.sortAt.getTime() - b.sortAt.getTime()
  );

  return NextResponse.json({
    user,
    order: orderDir,
    timeline: deduped.map((r) => ({ ...r, sortAt: r.sortAt.toISOString() })),
  });
}
