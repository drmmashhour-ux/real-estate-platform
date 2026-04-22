import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAcquisitionDashboardVm } from "@/modules/acquisition/acquisition.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const payload = await getAcquisitionDashboardVm();
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "acquisition_dashboard_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
