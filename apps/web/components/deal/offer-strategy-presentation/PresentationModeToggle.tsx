"use client";

import type { OfferStrategySimulatorMode } from "@/components/deal/offer-strategy-presentation/types";

export function PresentationModeToggle({
  mode,
  onChange,
}: {
  mode: OfferStrategySimulatorMode;
  onChange: (next: OfferStrategySimulatorMode) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1"
      role="tablist"
      aria-label="Offer strategy view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "client_presentation_mode"}
        onClick={() => onChange("client_presentation_mode")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          mode === "client_presentation_mode"
            ? "bg-premium-gold/20 text-premium-gold ring-1 ring-premium-gold/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Client presentation
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "internal_mode"}
        onClick={() => onChange("internal_mode")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          mode === "internal_mode"
            ? "bg-premium-gold/20 text-premium-gold ring-1 ring-premium-gold/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        Broker / internal
      </button>
    </div>
  );
}
