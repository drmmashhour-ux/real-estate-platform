"use client";

import { HubAiDock } from "./HubAiDock";

export function SellerHubAiSection(props: { pendingDocs: number; pendingContracts: number }) {
  return (
    <div className="mt-8 rounded-2xl border border-premium-gold/25 bg-premium-gold/5 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-premium-gold">AI Readiness Score</p>
      <p className="mt-1 text-xs text-slate-500">Listing copy, pricing hints, and publish checklist — guidance only.</p>
      <div className="mt-4">
        <HubAiDock
          hub="seller"
          accent="var(--color-premium-gold)"
          context={{
            pendingDocs: props.pendingDocs,
            pendingContracts: props.pendingContracts,
          }}
        />
      </div>
    </div>
  );
}
