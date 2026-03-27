"use client";

import { HubAiDock } from "./HubAiDock";

export function SellerHubAiSection(props: { pendingDocs: number; pendingContracts: number }) {
  return (
    <div className="mt-8 rounded-2xl border border-[#C9A646]/25 bg-[#C9A646]/5 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8C547]">AI Readiness Score</p>
      <p className="mt-1 text-xs text-slate-500">Listing copy, pricing hints, and publish checklist — guidance only.</p>
      <div className="mt-4">
        <HubAiDock
          hub="seller"
          accent="#C9A646"
          context={{
            pendingDocs: props.pendingDocs,
            pendingContracts: props.pendingContracts,
          }}
        />
      </div>
    </div>
  );
}
