import { existsSync, readFileSync } from "node:fs";

import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { resolveE2eReportJsonPath } from "@/modules/e2e-simulation/simulation-report.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/testing/e2e-report — latest `apps/web/tests/reports/final-e2e-report.json`.
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const path = process.env.LECIPM_E2E_SIMULATION_REPORT_PATH?.trim() || resolveE2eReportJsonPath();
  if (!existsSync(path)) {
    return NextResponse.json({
      ok: true,
      missing: true,
      hint: "Run: cd apps/web && pnpm run simulate:platform",
      path,
    });
  }

  try {
    const raw = readFileSync(path, "utf8");
    const report = JSON.parse(raw) as unknown;
    return NextResponse.json({ ok: true, missing: false, path, report });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "read failed",
        path,
      },
      { status: 500 }
    );
  }
}
