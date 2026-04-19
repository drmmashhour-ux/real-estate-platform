"use client";

/**
 * Thin leadership shell around the execution-results engine — Deal performance label only.
 */

import { GrowthExecutionResultsPanel } from "./GrowthExecutionResultsPanel";

export function DealPerformancePanel() {
  return (
    <div id="growth-mc-deal-performance" className="scroll-mt-24 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-400/85">
        Deal performance engine
      </p>
      <GrowthExecutionResultsPanel />
    </div>
  );
}
