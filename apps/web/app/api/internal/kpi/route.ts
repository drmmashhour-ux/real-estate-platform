import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { loadKpiSnapshot } from "@/modules/kpi/application/loadKpiSnapshot";

export const dynamic = "force-dynamic";

/** GET — core business KPIs (admin-only). */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const data = await loadKpiSnapshot(prisma);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load KPI snapshot";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
