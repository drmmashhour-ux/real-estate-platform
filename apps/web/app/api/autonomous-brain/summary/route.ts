import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildAutonomousBrainSummary } from "@/modules/autonomous-brain/autonomous-brain-summary.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const summary = await buildAutonomousBrainSummary();
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[autonomous-brain/summary]", e);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }
}
