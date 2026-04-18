/**
 * Phase 7 — homepage + /api/ready thresholds (warn-only; evidence in report).
 */
import { validatePage } from "@/modules/validation/page-validator.service";
import { runApiProbe } from "@/modules/validation/api-validator.service";
import type { PerformanceThresholdResult } from "./final-launch-report.types";

const PAGE_WARN_MS = 3000;
const API_WARN_MS = 1000;

function base(): string {
  return (process.env.VALIDATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
}

export async function measurePrelaunchPerformance(): Promise<PerformanceThresholdResult> {
  const b = base();
  const page = await validatePage({ baseUrl: b, path: "/en/ca", allowAuthWall: true });
  const api = await runApiProbe(b, {
    name: "ready_perf",
    method: "GET",
    path: "/api/ready",
    expectStatusMin: 200,
    expectStatusMax: 299,
  });

  const homepageLoadMs = page.loadTimeMs;
  const apiReadyMs = api.responseTimeMs;

  const homepageWarn =
    homepageLoadMs !== undefined && homepageLoadMs > PAGE_WARN_MS
      ? `homepage_${homepageLoadMs}ms_exceeds_${PAGE_WARN_MS}ms`
      : undefined;
  const apiReadyWarn =
    apiReadyMs !== undefined && apiReadyMs > API_WARN_MS
      ? `api_ready_${apiReadyMs}ms_exceeds_${API_WARN_MS}ms`
      : undefined;

  return { homepageLoadMs, apiReadyMs, homepageWarn, apiReadyWarn };
}
