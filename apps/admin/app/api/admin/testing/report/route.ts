import { existsSync, readFileSync } from "node:fs";

import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { resolveReportPath } from "@/modules/testing/test-report.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/testing/report — latest `tests/reports/final-report.json` from repo (local/staging).
 * Vercel serverless has no access to monorepo file path unless mounted; use CI artifact or copy report to blob for prod.
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const path = process.env.LECIPM_VALIDATION_REPORT_PATH?.trim() || resolveReportPath();
  if (!existsSync(path)) {
    return NextResponse.json({
      ok: true,
      missing: true,
      hint: "Run locally: pnpm --filter @lecipm/web run validate:lecipm-system",
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
      { status: 500 },
    );
  }
}
