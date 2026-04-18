import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { runUserSimulationEngine } from "@/modules/simulation/user-simulation.engine";
import { writeUserSimulationReport } from "@/modules/simulation/simulation-report.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/simulation/run — admin-only; runs LECIPM Real User Simulation v1 and writes JSON report.
 */
export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const report = await runUserSimulationEngine();
    writeUserSimulationReport(report);
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
