"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lecipm_bnhub_venue_mode";

export type VenueMode = "hosting" | "hotel" | "motel";

const MODES: { id: VenueMode; label: string; hint: string }[] = [
  { id: "hosting", label: "Hosting", hint: "Homes & apartments" },
  { id: "hotel", label: "Hotel", hint: "Multi-unit front desk ops" },
  { id: "motel", label: "Motel", hint: "Drive-up / roadside stays" },
];

/**
 * Same BNHUB host dashboard; mode switches copy and future filters (amenities, policies).
 */
export function HostVenueModeBar() {
  const [mode, setMode] = useState<VenueMode>("hosting");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "hosting" || raw === "hotel" || raw === "motel") setMode(raw);
    } catch {
      /* ignore */
    }
  }, []);

  function select(next: VenueMode) {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bnhub-panel mb-8 p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/85">Property type</p>
      <p className="mt-1 text-xs text-neutral-500">
        One host dashboard — pick how you operate so we can tailor options (BNHUB short stays only).
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => select(m.id)}
            className={`rounded-xl border px-4 py-2.5 text-left transition ${
              mode === m.id
                ? "border-premium-gold/50 bg-premium-gold/15 text-white"
                : "border-white/10 bg-black/30 text-neutral-300 hover:border-premium-gold/25"
            }`}
          >
            <span className="block text-sm font-semibold">{m.label}</span>
            <span className="block text-[11px] text-neutral-500">{m.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
