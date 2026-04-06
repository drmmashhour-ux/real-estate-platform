"use client";

import { useEffect, useState } from "react";
import { useListingWizard } from "@/stores/useListingWizard";

export function StepPricing() {
  const city = useListingWizard((s) => s.city);
  const price = useListingWizard((s) => s.price);
  const updateField = useListingWizard((s) => s.updateField);
  const nextStep = useListingWizard((s) => s.nextStep);
  const prevStep = useListingWizard((s) => s.prevStep);

  const [suggested, setSuggested] = useState<number | null>(null);

  useEffect(() => {
    if (!city.trim()) return;
    let cancelled = false;
    void (async () => {
      const r = await fetch("/api/host/listing-wizard/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "price", city }),
      });
      const j = (await r.json()) as { suggestedPrice?: number };
      if (!cancelled && typeof j.suggestedPrice === "number") setSuggested(j.suggestedPrice);
    })();
    return () => {
      cancelled = true;
    };
  }, [city]);

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="wiz-price">
          Price per night (CAD)
        </label>
        <input
          id="wiz-price"
          type="number"
          min={0}
          step={1}
          className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-4 text-lg text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          value={Number.isFinite(price) ? price : 0}
          onChange={(e) => updateField("price", Math.max(0, parseInt(e.target.value, 10) || 0))}
        />
      </div>

      {suggested != null ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center">
          <p className="text-sm text-amber-100">
            💰 Suggested price: <strong>${suggested}</strong> / night
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-slate-900"
            onClick={() => updateField("price", suggested)}
          >
            Use suggestion
          </button>
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => prevStep()}
          className="flex-1 rounded-2xl border border-white/20 py-4 text-lg font-medium text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => nextStep()}
          className="flex-1 rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-slate-950"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
