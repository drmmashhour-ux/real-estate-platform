import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { PlatformValidationReportV1 } from "@/modules/validation/types";

export const dynamic = "force-dynamic";

function resolveV1ReportPath(): string {
  const env = process.env.LECIPM_PLATFORM_VALIDATION_V1_REPORT_PATH?.trim();
  if (env) return env;
  return join(process.cwd(), "tests", "reports", "final-validation-report.json");
}

/**
 * GET /api/admin/validation/platform-v1 — latest `tests/reports/final-validation-report.json` (from `pnpm validate:platform`).
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const path = resolveV1ReportPath();
  if (!existsSync(path)) {
    return NextResponse.json({
      ok: true,
      missing: true,
      hint: "Run locally from apps/web: pnpm validate:platform (requires server for HTTP phases unless VALIDATION_OFFLINE=1).",
      path,
    });
  }

  try {
    const raw = readFileSync(path, "utf8");
    const report = JSON.parse(raw) as PlatformValidationReportV1;
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
