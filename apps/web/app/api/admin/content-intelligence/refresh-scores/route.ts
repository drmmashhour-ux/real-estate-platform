import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { refreshAllMachineContentPerformanceScores } from "@/lib/content-intelligence/analyze-performance";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { updated } = await refreshAllMachineContentPerformanceScores();
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
