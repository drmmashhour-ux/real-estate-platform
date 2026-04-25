import { NextRequest, NextResponse } from "next/server";
import { assertFieldTeamApi } from "@/lib/admin/field-team-admin";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sid = await requireSessionUserIdOr401(req);
  if (sid instanceof NextResponse) return sid;
  const user = await prisma.user.findUnique({
    where: { id: sid.userId },
    select: { id: true, email: true, role: true },
  });
  if (!assertFieldTeamApi(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.fieldSpecialistPerformance.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const sid = await requireSessionUserIdOr401(req);
  if (sid instanceof NextResponse) return sid;
  const actor = await prisma.user.findUnique({
    where: { id: sid.userId },
    select: { id: true, email: true, role: true },
  });
  if (!assertFieldTeamApi(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const userId = String(body.userId ?? "").trim();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const row = await prisma.fieldSpecialistPerformance.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return NextResponse.json(row);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
