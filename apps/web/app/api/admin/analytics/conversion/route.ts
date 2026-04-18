import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { intelligenceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Funnel conversion snapshot (internal events — not a substitute for product analytics warehouse).
 */
export async function GET() {
  if (!intelligenceFlags.analyticsDashboardV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows = await prisma.analyticsFunnelEvent.groupBy({
    by: ["name"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  return NextResponse.json({
    ok: true,
    range: "30d",
    steps: rows.map((r) => ({ name: r.name, count: r._count.id })),
  });
}
