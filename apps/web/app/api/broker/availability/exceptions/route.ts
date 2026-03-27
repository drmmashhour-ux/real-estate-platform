import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const brokerId =
    session.role === "ADMIN"
      ? new URL(request.url).searchParams.get("brokerId")?.trim() || null
      : session.id;
  if (!brokerId) {
    return NextResponse.json({ error: "brokerId query required for admin" }, { status: 400 });
  }
  const exceptions = await prisma.availabilityException.findMany({
    where: { brokerId },
    orderBy: { startsAt: "asc" },
    take: 200,
  });
  return NextResponse.json({ ok: true, exceptions });
}

export async function POST(request: NextRequest) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  let brokerId = session.id;
  if (session.role === "ADMIN") {
    const raw = typeof body.brokerId === "string" ? body.brokerId.trim() : "";
    if (!raw) return NextResponse.json({ error: "brokerId required" }, { status: 400 });
    const b = await prisma.user.findUnique({ where: { id: raw }, select: { id: true, role: true } });
    if (!b || b.role !== "BROKER") return NextResponse.json({ error: "Invalid broker" }, { status: 400 });
    brokerId = b.id;
  }

  const startsAt = body.startsAt ? new Date(String(body.startsAt)) : null;
  const endsAt = body.endsAt ? new Date(String(body.endsAt)) : null;
  if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "startsAt and endsAt required" }, { status: 400 });
  }
  if (endsAt <= startsAt) return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });

  const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;
  const isAvailable = body.isAvailable === true;

  const ex = await prisma.availabilityException.create({
    data: {
      brokerId,
      startsAt,
      endsAt,
      reason,
      isAvailable,
    },
  });
  return NextResponse.json({ ok: true, exception: ex });
}
