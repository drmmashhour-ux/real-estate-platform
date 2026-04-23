import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { computeAiCeoMeasurements } from "@/modules/ai-ceo/ai-ceo-outcome.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const measurements = await computeAiCeoMeasurements();
    return NextResponse.json({ success: true, measurements });
  } catch (e) {
    console.error("[ai-ceo/outcomes]", e);
    return NextResponse.json({ error: "outcomes_failed" }, { status: 500 });
  }
}
