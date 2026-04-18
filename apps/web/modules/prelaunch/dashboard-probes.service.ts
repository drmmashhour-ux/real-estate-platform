/**
 * Phase 11 — dashboard HTML smoke (auth walls allowed).
 */
import { validatePage } from "@/modules/validation/page-validator.service";

const PATHS = [
  "/en/ca/dashboard/growth/reports",
  "/en/ca/dashboard/marketing-studio",
  "/en/ca/dashboard/lecipm-ai-autopilot",
  "/en/ca/admin/fraud",
  "/en/ca/admin/growth",
];

function base(): string {
  return (process.env.VALIDATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
}

export async function runDashboardProbes(): Promise<
  { path: string; status: string; httpStatus?: number; detail?: string }[]
> {
  const b = base();
  const out: { path: string; status: string; httpStatus?: number; detail?: string }[] = [];
  for (const path of PATHS) {
    const r = await validatePage({ baseUrl: b, path, allowAuthWall: true });
    out.push({
      path,
      status: r.status,
      httpStatus: r.httpStatus,
      detail: r.errors[0] ?? r.warnings[0],
    });
  }
  return out;
}
