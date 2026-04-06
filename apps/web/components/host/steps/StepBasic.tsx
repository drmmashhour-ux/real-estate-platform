"use client";

import { useListingWizard } from "@/stores/useListingWizard";

export function StepBasic() {
  const city = useListingWizard((s) => s.city);
  const title = useListingWizard((s) => s.title);
  const updateField = useListingWizard((s) => s.updateField);
  const nextStep = useListingWizard((s) => s.nextStep);

  async function generateTitle() {
    const r = await fetch("/api/host/listing-wizard/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "title", city }),
    });
    const j = (await r.json()) as { title?: string };
    if (j.title) updateField("title", j.title);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="wiz-city">
          City
        </label>
        <input
          id="wiz-city"
          className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-4 text-lg text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="e.g. Montreal"
          value={city}
          onChange={(e) => updateField("city", e.target.value)}
          autoComplete="address-level2"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="wiz-title">
            Title <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => void generateTitle()}
            disabled={!city.trim()}
            className="rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/40 disabled:opacity-40"
          >
            ✨ Generate title
          </button>
        </div>
        <input
          id="wiz-title"
          className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-4 text-lg text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="Short, catchy name"
          value={title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => nextStep()}
        disabled={!city.trim()}
        className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
