import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const runs = await prisma.aiEvalRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { select: { id: true, passed: true, createdAt: true }, take: 200 } },
  });
  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      subsystem: r.subsystem,
      name: r.name,
      status: r.status,
      metrics: r.metrics,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
      itemsTotal: r.items.length,
      passed: r.items.filter((i) => i.passed === true).length,
    })),
  });
}
