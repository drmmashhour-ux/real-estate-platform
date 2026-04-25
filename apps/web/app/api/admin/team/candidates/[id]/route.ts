import { NextRequest, NextResponse } from "next/server";
import { assertFieldTeamApi } from "@/lib/admin/field-team-admin";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { prisma } from "@/lib/db";

const ALLOWED_STATUS = new Set(["applied", "interview", "accepted", "rejected"]);

async function guard(req: NextRequest) {
  const sid = await requireSessionUserIdOr401(req);
  if (sid instanceof NextResponse) return { error: sid as NextResponse };
  const user = await prisma.user.findUnique({
    where: { id: sid.userId },
    select: { id: true, email: true, role: true },
  });
  if (!assertFieldTeamApi(user)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      notes?: string | null;
      status?: string;
      interviewScores?: object;
      linkedUserId?: string | null;
    } = {};

    if (body.name != null) data.name = String(body.name).trim();
    if (body.email != null) data.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) data.phone = body.phone == null ? null : String(body.phone).trim() || null;
    if (body.notes !== undefined) data.notes = body.notes == null ? null : String(body.notes);
    if (body.status != null) {
      const st = String(body.status);
      if (!ALLOWED_STATUS.has(st)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
      data.status = st;
    }
    if (body.interviewScores !== undefined) {
      data.interviewScores = body.interviewScores as object;
    }
    if (body.linkedUserId !== undefined) {
      data.linkedUserId = body.linkedUserId == null || body.linkedUserId === "" ? null : String(body.linkedUserId);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    const updated = await prisma.fieldTeamCandidate.update({
      where: { id },
      data,
      include: {
        linkedUser: { select: { id: true, email: true, name: true } },
      },
    });

    if (updated.status === "accepted" && updated.linkedUserId) {
      await prisma.fieldSpecialistPerformance.upsert({
        where: { userId: updated.linkedUserId },
        create: { userId: updated.linkedUserId },
        update: {},
      });
    }

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  try {
    await prisma.fieldTeamCandidate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
