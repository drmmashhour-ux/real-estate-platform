import { NextRequest, NextResponse } from "next/server";
import { assertFieldTeamApi } from "@/lib/admin/field-team-admin";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { prisma } from "@/lib/db";

const ALLOWED_STATUS = new Set(["applied", "interview", "accepted", "rejected"]);

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

  const candidates = await prisma.fieldTeamCandidate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      linkedUser: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json(candidates);
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
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }
    const phone = body.phone != null ? String(body.phone).trim() || null : null;
    const status = String(body.status ?? "applied");
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const created = await prisma.fieldTeamCandidate.create({
      data: {
        name,
        email,
        phone,
        status,
        notes: body.notes != null ? String(body.notes) : null,
      },
      include: {
        linkedUser: { select: { id: true, email: true, name: true } },
      },
    });
    return NextResponse.json(created);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
