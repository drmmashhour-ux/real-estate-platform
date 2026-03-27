"use client";

import { MORTGAGE_AI_LEGAL_NOTICE } from "@/modules/ai/mortgage/mortgage-ai";
import { HubAiInsightWidget } from "@/components/ai/HubAiWidgets";

export function MortgageHubAiCard(props: {
  purchasePrice?: string;
  purchaseRegion?: string;
}) {
  const ctx = {
    purchasePrice: props.purchasePrice ?? "",
    purchaseRegion: props.purchaseRegion ?? "",
    surface: "mortgage_landing",
  };

  return (
    <div className="mt-6 rounded-2xl border border-[#C9A646]/20 bg-[#141414] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">Request summary (AI)</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{MORTGAGE_AI_LEGAL_NOTICE}</p>
      <div className="mt-3">
        <HubAiInsightWidget
          hub="mortgage"
          feature="request_summary"
          intent="summary"
          title="Your scenario"
          context={ctx}
          accent="#C9A646"
        />
      </div>
    </div>
  );
}
