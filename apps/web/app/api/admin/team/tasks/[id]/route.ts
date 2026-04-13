import { NextRequest, NextResponse } from "next/server";
import { TeamTaskStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaffPortalSession } from "@/lib/admin/staff-portal-auth";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  resultNotes: z.string().max(20000).optional().nullable(),
  impactScore: z.number().int().min(1).max(5).optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.teamTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (auth.role !== "ADMIN" && task.assigneeUserId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: {
    status?: TeamTaskStatus;
    startedAt?: Date;
    completedAt?: Date | null;
    resultNotes?: string | null;
    impactScore?: number | null;
  } = {};

  if (parsed.data.status != null) {
    data.status = parsed.data.status;
    if (parsed.data.status === TeamTaskStatus.IN_PROGRESS && task.status === TeamTaskStatus.PENDING) {
      data.startedAt = new Date();
    }
    if (parsed.data.status === TeamTaskStatus.DONE) {
      data.completedAt = new Date();
    } else if (parsed.data.status !== task.status) {
      data.completedAt = null;
    }
  }
  if (parsed.data.resultNotes !== undefined) data.resultNotes = parsed.data.resultNotes;
  if (parsed.data.impactScore !== undefined) data.impactScore = parsed.data.impactScore;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const updated = await prisma.teamTask.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task: updated });
}
