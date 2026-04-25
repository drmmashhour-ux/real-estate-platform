import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { loadOperationalTrustAdminDashboard } from "@/modules/trust-score/trust-score-admin.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const dashboard = await loadOperationalTrustAdminDashboard(prisma);
    return NextResponse.json(dashboard);
  } catch (e) {
    console.error("[api/admin/trust-score/dashboard]", e);
    return NextResponse.json({ error: "dashboard_failed" }, { status: 500 });
  }
}
