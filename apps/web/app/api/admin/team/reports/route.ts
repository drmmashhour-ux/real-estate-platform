import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaffPortalSession } from "@/lib/admin/staff-portal-auth";
import { utcDateKey } from "@/lib/team/team-queries";

export const dynamic = "force-dynamic";

const reportSchema = z.object({
  reportDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedWork: z.string().min(1).max(50000),
  results: z.string().max(50000).optional().nullable(),
  issues: z.string().max(50000).optional().nullable(),
});

/**
 * GET /api/admin/team/reports — recent daily reports (self; admin may pass ?userId=).
 */
export async function GET(req: NextRequest) {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const userIdParam = req.nextUrl.searchParams.get("userId");
  let filterUserId = auth.userId;
  if (auth.role === "ADMIN" && userIdParam?.trim()) {
    filterUserId = userIdParam.trim();
  }

  const reports = await prisma.teamDailyReport.findMany({
    where: { userId: filterUserId },
    orderBy: { reportDay: "desc" },
    take: 60,
  });

  return NextResponse.json({ reports });
}

/**
 * POST /api/admin/team/reports — upsert daily report for a UTC day.
 */
export async function POST(req: NextRequest) {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetUserId = auth.userId;

  const row = await prisma.teamDailyReport.upsert({
    where: {
      userId_reportDay: { userId: targetUserId, reportDay: parsed.data.reportDay },
    },
    create: {
      userId: targetUserId,
      reportDay: parsed.data.reportDay,
      completedWork: parsed.data.completedWork.trim(),
      results: parsed.data.results?.trim() || undefined,
      issues: parsed.data.issues?.trim() || undefined,
    },
    update: {
      completedWork: parsed.data.completedWork.trim(),
      results: parsed.data.results?.trim() || undefined,
      issues: parsed.data.issues?.trim() || undefined,
    },
  });

  return NextResponse.json({ report: row });
}
