import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";
import { normalizeDayOfWeek, normalizeMinuteRange } from "@/modules/scheduling/services/validate-availability";

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
  const rules = await prisma.availabilityRule.findMany({
    where: { brokerId },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
  return NextResponse.json({ ok: true, rules });
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

  const dow = typeof body.dayOfWeek === "number" ? body.dayOfWeek : parseInt(String(body.dayOfWeek), 10);
  const d = normalizeDayOfWeek(dow);
  if (!d.ok) return NextResponse.json({ error: d.error }, { status: 400 });

  const sm = typeof body.startMinute === "number" ? body.startMinute : parseInt(String(body.startMinute), 10);
  const em = typeof body.endMinute === "number" ? body.endMinute : parseInt(String(body.endMinute), 10);
  const mr = normalizeMinuteRange(sm, em);
  if (!mr.ok) return NextResponse.json({ error: mr.error }, { status: 400 });

  const timezone = typeof body.timezone === "string" ? body.timezone.trim() || null : null;
  const isActive = body.isActive === false ? false : true;

  const rule = await prisma.availabilityRule.create({
    data: {
      brokerId,
      dayOfWeek: d.value,
      startMinute: mr.startMinute,
      endMinute: mr.endMinute,
      isActive,
      timezone,
    },
  });
  return NextResponse.json({ ok: true, rule });
}
