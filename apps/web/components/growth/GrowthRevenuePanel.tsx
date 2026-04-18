"use client";

import * as React from "react";
import { RevenueOverviewPanel } from "@/components/revenue/RevenueOverviewPanel";

/**
 * Growth Machine revenue strip — same read-only dashboard as {@link RevenueOverviewPanel}
 * (kept for layout / flag parity with `FEATURE_GROWTH_REVENUE_PANEL_V1`).
 */
export function GrowthRevenuePanel() {
  return <RevenueOverviewPanel />;
}
