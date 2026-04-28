import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Admin-only entity timeline (replay / audit). Sorted by `createdAt` (default newest first).
 */
export async function GET(req: Request): Promise<Response> {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType")?.trim();
  const entityId = url.searchParams.get("entityId")?.trim();
  const orderParam = url.searchParams.get("order")?.trim().toLowerCase();
  const order = orderParam === "asc" ? "asc" : "desc";

  if (!entityType || !entityId) {
    return NextResponse.json({ ok: false, message: "entityType and entityId required" }, { status: 400 });
  }

  try {
    const events = await prisma.syriaEventTimeline.findMany({
      where: { entityType: entityType.slice(0, 128), entityId: entityId.slice(0, 128) },
      orderBy: { createdAt: order },
      take: 500,
    });
    return NextResponse.json({ ok: true, events });
  } catch (e) {
    console.error("[admin/timeline]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, message: "timeline_load_failed" }, { status: 500 });
  }
}
