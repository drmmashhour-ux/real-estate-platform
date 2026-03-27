import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? "").trim();
  const take = Math.min(100, Math.max(10, parseInt(searchParams.get("take") ?? "40", 10) || 40));

  const rows = await prisma.platformLegalDispute.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      status: true,
      bookingId: true,
      listingId: true,
      dealId: true,
      leadId: true,
      platformPaymentId: true,
      openedByUserId: true,
      targetUserId: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: rows });
}

export async function PATCH(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { id?: unknown; status?: unknown; resolutionNote?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const nextStatus = typeof body.status === "string" ? body.status.trim() : "";
  if (!id || !nextStatus) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const resolutionNote = typeof body.resolutionNote === "string" ? body.resolutionNote.trim() : undefined;

  const updated = await prisma.platformLegalDispute.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(resolutionNote !== undefined ? { resolutionNote } : {}),
    },
  });

  return NextResponse.json({ ok: true, dispute: updated });
}
