import { existsSync, readFileSync } from "node:fs";

import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { resolveSimulationReportPath } from "@/modules/simulation/simulation-report.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/simulation/results — latest report from disk (local/CI) or missing hint.
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const path = resolveSimulationReportPath();
  if (!existsSync(path)) {
    return NextResponse.json({
      ok: true,
      missing: true,
      hint: "POST /api/simulation/run first, or run from server with filesystem access.",
      path,
    });
  }

  try {
    const raw = readFileSync(path, "utf8");
    const report = JSON.parse(raw) as unknown;
    return NextResponse.json({ ok: true, missing: false, path, report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), path },
      { status: 500 },
    );
  }
}
