"use client";

import { HubAiDock } from "./HubAiDock";

export function BuyerHubAiSection() {
  return (
    <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400/90">AI Property Insight</p>
      <p className="mt-1 text-xs text-slate-500">Search, compare, and affordability — short answers, you stay in control.</p>
      <div className="mt-4">
        <HubAiDock hub="buyer" accent="#fbbf24" />
      </div>
    </div>
  );
}
