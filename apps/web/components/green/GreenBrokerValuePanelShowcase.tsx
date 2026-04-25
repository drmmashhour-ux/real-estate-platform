"use client";

import { useMemo, useState } from "react";
import { decorateListingWithGreenSignals } from "@/modules/green-ai/green-search-decoration.service";
import { GreenBrokerValuePanel } from "./GreenBrokerValuePanel";

/**
 * In-dashboard demo: two listings via {@link decorateListingWithGreenSignals} + opportunity buckets + comparison.
 * Wire your broker workspace to pass real `decoration` + `isPremiumGreen` from subscription.
 */
export function GreenBrokerValuePanelShowcase() {
  const [premium, setPremium] = useState(false);
  const [fsbo, setFsbo] = useState(false);

  const primary = useMemo(
    () =>
      decorateListingWithGreenSignals({
        id: "broker-value-demo-1",
        yearBuilt: 1994,
        lecipmGreenMetadataJson: {
          quebecEsgSnapshot: {
            score: 58,
            label: "STANDARD",
            breakdown: { heating: 48, insulation: 52, windows: 50, energyEfficiency: 50, materials: 50, water: 50, bonus: 0 },
            improvementAreas: ["heating", "envelope"],
            disclaimer: "d",
          },
          greenSearchSnapshot: { projectedScore: 80, scoreDelta: 15, rankingBoostSuggestion: 1.04 },
        },
      }),
    [],
  );

  const peer = useMemo(
    () =>
      decorateListingWithGreenSignals({
        id: "broker-value-demo-2",
        yearBuilt: 2016,
        lecipmGreenMetadataJson: {
          quebecEsgSnapshot: {
            score: 76,
            label: "GREEN",
            breakdown: { heating: 80, insulation: 76, windows: 74, energyEfficiency: 78, materials: 70, water: 70, bonus: 0 },
            improvementAreas: [],
            disclaimer: "d",
          },
          greenSearchSnapshot: { projectedScore: 82, scoreDelta: 6, rankingBoostSuggestion: 1.01 },
        },
      }),
    [],
  );

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Tool preview</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Green value for brokers / FSBO</h2>
        <p className="mt-1 text-sm text-zinc-400">Sample data — remplace by listing + subscription flags côté serveur.</p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-zinc-200">
          <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} className="rounded border-zinc-600" />
          isPremiumGreen
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-zinc-200">
          <input type="checkbox" checked={fsbo} onChange={(e) => setFsbo(e.target.checked)} className="rounded border-zinc-600" />
          FSBO seller view
        </label>
      </div>
      <GreenBrokerValuePanel
        decoration={primary}
        isPremiumGreen={premium}
        isFsbo={fsbo}
        peerDecoration={peer}
        selfLabel="Subject listing"
        peerLabel="Tighter comp (higher current score)"
        onUnlockFullAnalysis={() => setPremium(true)}
      />
    </section>
  );
}
