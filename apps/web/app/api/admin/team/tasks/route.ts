import { NextRequest, NextResponse } from "next/server";
import { TeamTaskPriority, TeamTaskStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminOnlySession, requireStaffPortalSession } from "@/lib/admin/staff-portal-auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  assigneeUserId: z.string().min(8),
  title: z.string().min(1).max(512),
  description: z.string().max(20000).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
  dueAt: z.string().optional(),
});

/**
 * GET /api/admin/team/tasks — list tasks (assignee=self for ops; admin can filter).
 */
export async function GET(req: NextRequest) {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const assigneeId = req.nextUrl.searchParams.get("assigneeId");
  const status = req.nextUrl.searchParams.get("status") as TeamTaskStatus | null;

  let filterAssignee = auth.userId;
  if (auth.role === "ADMIN" && assigneeId?.trim()) {
    filterAssignee = assigneeId.trim();
  }

  const where = {
    assigneeUserId: filterAssignee,
    ...(status && Object.values(TeamTaskStatus).includes(status) ? { status } : {}),
  };

  const tasks = await prisma.teamTask.findMany({
    where,
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    take: 200,
  });

  return NextResponse.json({ tasks });
}

/**
 * POST /api/admin/team/tasks — create task (admin only).
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assignee = await prisma.user.findUnique({
    where: { id: parsed.data.assigneeUserId },
    select: { id: true },
  });
  if (!assignee) {
    return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
  }

  const priority = (parsed.data.priority ?? "NORMAL") as TeamTaskPriority;
  const dueAt =
    parsed.data.dueAt && !Number.isNaN(Date.parse(parsed.data.dueAt))
      ? new Date(parsed.data.dueAt)
      : undefined;

  const task = await prisma.teamTask.create({
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || undefined,
      priority,
      assigneeUserId: assignee.id,
      createdByUserId: admin.userId,
      dueAt,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task });
}
