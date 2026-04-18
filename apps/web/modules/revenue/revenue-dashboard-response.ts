/**
 * Parses GET /api/growth/revenue responses — used by RevenueOverviewPanel + unit tests (no fetch in tests).
 */

import type { RevenueDashboardSummary } from "./revenue-dashboard.types";

export type RevenueFlagsBlockedPayload = {
  code: "REVENUE_FLAGS_DISABLED";
  requiredFlags: { env: string; hint: string }[];
};

export type InterpretGrowthRevenueJsonResult =
  | { kind: "ok"; summary: RevenueDashboardSummary }
  | { kind: "flags_disabled"; payload: RevenueFlagsBlockedPayload }
  | { kind: "error"; message: string };

export function interpretGrowthRevenueJson(
  status: number,
  raw: unknown,
): InterpretGrowthRevenueJsonResult {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  if (status === 403) {
    if (body.code === "REVENUE_FLAGS_DISABLED") {
      const rf = body.requiredFlags;
      const flags = Array.isArray(rf)
        ? rf.filter(
            (x): x is { env: string; hint: string } =>
              !!x &&
              typeof x === "object" &&
              typeof (x as { env?: string }).env === "string" &&
              typeof (x as { hint?: string }).hint === "string",
          )
        : [];
      return {
        kind: "flags_disabled",
        payload: { code: "REVENUE_FLAGS_DISABLED", requiredFlags: flags },
      };
    }
    const msg = typeof body.error === "string" ? body.error : "Forbidden";
    return { kind: "error", message: msg };
  }

  if (status >= 200 && status < 300) {
    const summary = body.summary as RevenueDashboardSummary | undefined;
    if (summary && typeof summary === "object" && typeof summary.revenueToday === "number") {
      return { kind: "ok", summary };
    }
    return {
      kind: "error",
      message: typeof body.error === "string" ? body.error : "Invalid response",
    };
  }

  const msg = typeof body.error === "string" ? body.error : `HTTP ${status}`;
  return { kind: "error", message: msg };
}
