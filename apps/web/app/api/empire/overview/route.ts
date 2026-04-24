import { requireAdmin } from "@/modules/security/access-guard.service";
import { getEmpireControlDashboardData } from "@/modules/empire/control-center.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const data = await getEmpireControlDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[empire:api] overview failed", error);
    return NextResponse.json({ error: "Failed to fetch empire overview" }, { status: 500 });
  }
}
