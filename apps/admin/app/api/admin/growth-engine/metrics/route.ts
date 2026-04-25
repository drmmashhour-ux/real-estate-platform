import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { getGrowthEngineDashboardMetrics } from "@/lib/growth/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const metrics = await getGrowthEngineDashboardMetrics(prisma);
  return NextResponse.json(metrics);
}
