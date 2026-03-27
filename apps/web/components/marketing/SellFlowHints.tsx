"use client";

import { HintTooltip } from "@/components/ui/HintTooltip";

export function SellFlowHints() {
  return (
    <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-4 text-[11px] text-[#9CA3AF]">
      <HintTooltip label="FREE AI evaluation — no obligation to list.">
        <span>Free evaluation</span>
      </HintTooltip>
      <HintTooltip label="FSBO uses a one-time listing fee; broker path uses a separate agreement.">
        <span>Clear fees</span>
      </HintTooltip>
      <HintTooltip label="Optional consultation with a licensed Québec broker.">
        <span>Broker support</span>
      </HintTooltip>
    </div>
  );
}
