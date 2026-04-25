import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { immoEventSlug } from "@/lib/timeline/immo-event-labels";
import { getImmoResolutionFromMetadata } from "@/lib/immo/immo-contact-resolution-metadata";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const pendingOnly = searchParams.get("pendingAction") === "1" || searchParams.get("pendingAction") === "true";
  const takeCap = pendingOnly ? 500 : 500;
  const take = Math.min(takeCap, Math.max(20, parseInt(searchParams.get("take") ?? (pendingOnly ? "300" : "100"), 10) || 100));
  const listingId = (searchParams.get("listingId") ?? "").trim();
  const filterUserId = (searchParams.get("userId") ?? "").trim();
  const orderParam = (searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const actionRange =
    dateFrom || dateTo
      ? {
          actionAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {};

  let rows = await prisma.immoContactLog.findMany({
    where: {
      ...(listingId ? { listingId } : {}),
      ...(filterUserId ? { userId: filterUserId } : {}),
      ...actionRange,
    },
    orderBy: { actionAt: orderDir },
    take: pendingOnly ? Math.min(800, take * 2) : take,
    select: {
      id: true,
      userId: true,
      listingId: true,
      listingKind: true,
      contactType: true,
      hub: true,
      targetUserId: true,
      brokerId: true,
      metadata: true,
      createdAt: true,
      actionAt: true,
      updatedAt: true,
      adminNote: true,
      adminNotedAt: true,
      adminNotedById: true,
    },
  });

  if (pendingOnly) {
    rows = rows.filter((r) => {
      const res = getImmoResolutionFromMetadata(r.metadata);
      if (!res) return false;
      return res.actionRequired && !res.actionCompleted;
    }).slice(0, take);
  }

  const data = rows.map((r) => ({
    ...r,
    /** Alias for API consumers — same as `contactType` (immutable event category). */
    eventType:
      r.metadata && typeof r.metadata === "object" && typeof (r.metadata as { eventType?: unknown }).eventType === "string"
        ? ((r.metadata as { eventType?: string }).eventType ?? r.contactType)
        : r.contactType,
    eventSlug: immoEventSlug(r.contactType),
    /** Same JSON as `metadata` — explicit name for clients. */
    metadataJson: r.metadata,
  }));

  return NextResponse.json({ data });
}
