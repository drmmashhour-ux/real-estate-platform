/**
 * @deprecated Prefer `buildRevenueDashboardSummary` from `./revenue-dashboard.service`.
 * Thin compatibility layer for older imports.
 */

export { buildRevenueDashboardSummary } from "./revenue-dashboard.service";
export type { RevenueDashboardSummary } from "./revenue-dashboard.types";

import { buildRevenueDashboardSummary } from "./revenue-dashboard.service";
import type { RevenueDashboardSummary } from "./revenue-dashboard.types";

/** @deprecated Use `buildRevenueDashboardSummary` */
export async function buildRevenueSummary(): Promise<RevenueDashboardSummary> {
  return buildRevenueDashboardSummary();
}
