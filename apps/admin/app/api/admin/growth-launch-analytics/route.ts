import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getBrokerLaunchAnalytics } from "@/modules/growth/growth-analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const analytics = await getBrokerLaunchAnalytics();
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
