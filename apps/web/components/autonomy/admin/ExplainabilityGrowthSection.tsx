"use client";

import { useState } from "react";
import { ExplainabilityPanel } from "./ExplainabilityPanel";

export function ExplainabilityGrowthSection(props: { enabled: boolean }) {
  const [listingId, setListingId] = useState("");
  const [open, setOpen] = useState(false);

  if (!props.enabled) return null;

  return (
    <>
      <section className="rounded-2xl border border-premium-gold/20 bg-gradient-to-b from-black/60 to-black/40 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold">Autonomy · Phase 6.5</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Explain AI decision (preview)</h2>
        <p className="mt-1 max-w-prose text-xs text-zinc-500">
          Read-only reasoning chain from signals through policy — dry-run only. No execution or messaging.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Listing ID
            <input
              value={listingId}
              onChange={(e) => setListingId(e.target.value.trim())}
              placeholder="FSBO listing id"
              className="w-64 rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm text-white placeholder:text-zinc-600"
            />
          </label>
          <button
            type="button"
            disabled={!listingId}
            onClick={() => setOpen(true)}
            className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Explain AI decision
          </button>
        </div>
      </section>
      {open && listingId ? (
        <ExplainabilityPanel listingId={listingId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
