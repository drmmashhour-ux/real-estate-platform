"use client";

import { useCallback } from "react";

/** Upper bound for the browse price range slider (CAD). */
export const BROWSE_PRICE_SLIDER_MAX_CAD = 20_000_000;

const STEP = 5_000;

function formatCadCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m % 1 === 0 ? `$${m}M` : `$${m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString("en-CA")}`;
}

type Props = {
  priceMin: number;
  /** `0` = no upper cap (slider at far right). */
  priceMax: number;
  onChange: (next: { priceMin: number; priceMax: number }) => void;
  tone?: "light" | "dark";
};

/**
 * Dual-handle range for min/max list price (CAD). Full span = no min/max filter (`0` / `0`).
 */
export function PriceRangeSlider({ priceMin, priceMax, onChange, tone = "light" }: Props) {
  const max = BROWSE_PRICE_SLIDER_MAX_CAD;
  const left = Math.min(Math.max(0, priceMin), max);
  const rightPos = priceMax > 0 ? Math.min(priceMax, max) : max;

  const leftPct = (left / max) * 100;
  const rightPct = (rightPos / max) * 100;

  const setLower = useCallback(
    (raw: number) => {
      const v = Math.round(raw / STEP) * STEP;
      const cap = priceMax > 0 ? Math.min(priceMax, max) : max;
      const nextMin = Math.max(0, Math.min(v, cap));
      onChange({ priceMin: nextMin, priceMax: priceMax });
    },
    [onChange, priceMax, max]
  );

  const setUpper = useCallback(
    (raw: number) => {
      const v = Math.round(raw / STEP) * STEP;
      const floor = priceMin;
      const nextPos = Math.max(floor, Math.min(v, max));
      const nextMax = nextPos >= max ? 0 : nextPos;
      const nextMin = nextMax > 0 ? Math.min(priceMin, nextMax) : priceMin;
      onChange({ priceMin: nextMin, priceMax: nextMax });
    },
    [onChange, priceMin, max]
  );

  const trackBg = tone === "light" ? "bg-slate-200" : "bg-white/15";
  const fillBg = "bg-premium-gold/80";
  const labelCls = tone === "light" ? "text-slate-600" : "text-slate-400";
  const thumbCls =
    tone === "light"
      ? "accent-premium-gold [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-premium-gold [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-premium-gold"
      : "accent-premium-gold [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0B0B0B] [&::-webkit-slider-thumb]:bg-premium-gold [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0B0B0B] [&::-moz-range-thumb]:bg-premium-gold";

  const maxFmt = formatCadCompact(max);

  return (
    <div className="pt-1">
      <div className={`relative mx-0.5 h-8 ${labelCls}`}>
        <div className={`pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full ${trackBg}`} />
        <div
          className={`pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${fillBg}`}
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(0, rightPct - leftPct)}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={STEP}
          value={left}
          onChange={(e) => setLower(Number(e.target.value))}
          className={`absolute inset-x-0 top-1/2 z-[2] w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent ${thumbCls}`}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={STEP}
          value={rightPos}
          onChange={(e) => setUpper(Number(e.target.value))}
          className={`absolute inset-x-0 top-1/2 z-[3] w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent ${thumbCls}`}
          aria-label="Maximum price"
        />
      </div>
      <div
        className={`mt-2 flex justify-between text-xs font-semibold tabular-nums ${tone === "light" ? "text-slate-700" : "text-slate-300"}`}
      >
        <span>$0</span>
        <span>{maxFmt}</span>
      </div>
    </div>
  );
}
