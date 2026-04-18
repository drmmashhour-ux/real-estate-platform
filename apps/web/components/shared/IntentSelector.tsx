"use client";

import type { InstantValueIntent } from "@/modules/conversion/instant-value.types";
import { useConversionEngineFlags } from "@/lib/conversion/use-conversion-engine-flags";
import { recordIntentSelection } from "@/modules/conversion/conversion-monitoring.service";

const OPTIONS: { id: InstantValueIntent; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "invest", label: "Invest" },
  { id: "host", label: "Host" },
];

type Props = {
  value: InstantValueIntent;
  onChange: (next: InstantValueIntent) => void;
  className?: string;
  size?: "default" | "compact";
};

export function IntentSelector({ value, onChange, className = "", size = "default" }: Props) {
  const conversionEngineFlags = useConversionEngineFlags();
  const pad = size === "compact" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";

  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`} role="group" aria-label="Intent">
      {OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              if (conversionEngineFlags.conversionUpgradeV1) {
                recordIntentSelection({ intent: opt.id, surface: "IntentSelector" });
              }
              onChange(opt.id);
            }}
            className={`min-h-[44px] rounded-full border font-medium transition ${
              selected
                ? "border-premium-gold bg-premium-gold/15 text-premium-gold"
                : "border-white/15 bg-black text-slate-300 hover:border-white/30"
            } ${pad}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
