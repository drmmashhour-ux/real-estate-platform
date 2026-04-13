import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminOnlySession, requireStaffPortalSession } from "@/lib/admin/staff-portal-auth";
import { utcDateKey } from "@/lib/team/team-queries";

export const dynamic = "force-dynamic";

const targetSchema = z.object({
  userId: z.string().min(8),
  targetDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskGoal: z.number().int().min(0).max(500).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

/**
 * GET /api/admin/team/targets?userId=&day= — today's target for self; admin can query any user/day.
 */
export async function GET(req: NextRequest) {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const day = req.nextUrl.searchParams.get("day")?.trim() || utcDateKey();
  let uid = auth.userId;
  const qUid = req.nextUrl.searchParams.get("userId")?.trim();
  if (auth.role === "ADMIN" && qUid) uid = qUid;

  const target = await prisma.teamDailyTarget.findUnique({
    where: { userId_targetDay: { userId: uid, targetDay: day } },
  });

  return NextResponse.json({ target, day });
}

/**
 * POST /api/admin/team/targets — set daily task goal (admin only).
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdminOnlySession();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = targetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const taskGoal = parsed.data.taskGoal ?? 5;

  const row = await prisma.teamDailyTarget.upsert({
    where: {
      userId_targetDay: { userId: user.id, targetDay: parsed.data.targetDay },
    },
    create: {
      userId: user.id,
      targetDay: parsed.data.targetDay,
      taskGoal,
      notes: parsed.data.notes?.trim() || undefined,
      createdById: admin.userId,
    },
    update: {
      taskGoal,
      notes: parsed.data.notes?.trim() || undefined,
      createdById: admin.userId,
    },
  });

  return NextResponse.json({ target: row });
}
