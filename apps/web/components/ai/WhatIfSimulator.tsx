"use client";

import { useMemo, useState } from "react";

type Props = {
  baseDealScore: number;
  baseRoiPercent: number | null;
  /** Optional label for disclaimer */
  disclaimer?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Deterministic scenario math — illustrative only, not a replacement for full analyzer output.
 * Price down → deal score up slightly; rent up → ROI up slightly.
 */
export function WhatIfSimulator({ baseDealScore, baseRoiPercent, disclaimer }: Props) {
  const [priceAdjPct, setPriceAdjPct] = useState(0);
  const [rentAdjPct, setRentAdjPct] = useState(0);

  const { dealScore, roi } = useMemo(() => {
    const ds = clamp(
      Math.round(baseDealScore + priceAdjPct * -0.35 + rentAdjPct * 0.28),
      0,
      100
    );
    const baseRoi = baseRoiPercent ?? 0;
    const roiOut =
      baseRoiPercent == null
        ? null
        : Math.round((baseRoi + rentAdjPct * 0.12 - priceAdjPct * 0.08) * 10) / 10;
    return { dealScore: ds, roi: roiOut };
  }, [baseDealScore, baseRoiPercent, priceAdjPct, rentAdjPct]);

  return (
    <div className="mt-4 rounded-lg border border-[#C9A646]/30 bg-black/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">What-if (quick)</p>
      <p className="mt-1 text-xs text-slate-500">
        Adjust assumptions to see directionally how scores move. Not a full re-run of the engine.
      </p>
      <div className="mt-3 space-y-3">
        <label className="block text-xs text-slate-400">
          Price vs list ({priceAdjPct >= 0 ? "+" : ""}
          {priceAdjPct}%)
          <input
            type="range"
            min={-15}
            max={15}
            step={1}
            value={priceAdjPct}
            onChange={(e) => setPriceAdjPct(Number(e.target.value))}
            className="mt-1 w-full accent-[#C9A646]"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Rent assumption ({rentAdjPct >= 0 ? "+" : ""}
          {rentAdjPct}%)
          <input
            type="range"
            min={-20}
            max={20}
            step={1}
            value={rentAdjPct}
            onChange={(e) => setRentAdjPct(Number(e.target.value))}
            className="mt-1 w-full accent-[#C9A646]"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <span className="text-slate-300">
          Deal score: <strong className="text-white">{dealScore}</strong>
        </span>
        {roi != null ? (
          <span className="text-slate-300">
            Illustrative ROI: <strong className="text-white">{roi}%</strong>
          </span>
        ) : (
          <span className="text-slate-500">ROI scenario not available</span>
        )}
      </div>
      {disclaimer ? <p className="mt-2 text-[10px] text-slate-600">{disclaimer}</p> : null}
    </div>
  );
}
