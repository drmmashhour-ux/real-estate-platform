import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { loadContentIntelligenceDashboard } from "@/lib/content-intelligence/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const data = await loadContentIntelligenceDashboard();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
