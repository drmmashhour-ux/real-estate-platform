import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getGrowthScaleDashboardSnapshot } from "@/modules/growth/growth-scale-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const data = await getGrowthScaleDashboardSnapshot();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
