"use client";

import { useListingWizard } from "@/stores/useListingWizard";

export function StepAI() {
  const city = useListingWizard((s) => s.city);
  const title = useListingWizard((s) => s.title);
  const price = useListingWizard((s) => s.price);
  const description = useListingWizard((s) => s.description);
  const amenities = useListingWizard((s) => s.amenities);
  const updateField = useListingWizard((s) => s.updateField);
  const nextStep = useListingWizard((s) => s.nextStep);
  const prevStep = useListingWizard((s) => s.prevStep);

  async function runDescription() {
    const r = await fetch("/api/host/listing-wizard/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "description",
        city,
        title,
        price,
        amenities,
      }),
    });
    const j = (await r.json()) as { description?: string };
    if (j.description) updateField("description", j.description);
  }

  async function runAmenities() {
    const r = await fetch("/api/host/listing-wizard/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "amenities" }),
    });
    const j = (await r.json()) as { amenities?: string[] };
    if (Array.isArray(j.amenities)) updateField("amenities", j.amenities);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Let AI draft your description and amenities. Edit anytime later.</p>

      <button
        type="button"
        onClick={() => void runDescription()}
        disabled={!city.trim()}
        className="w-full rounded-2xl bg-violet-500/90 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/20 disabled:opacity-40"
      >
        Generate description
      </button>

      {description ? (
        <p className="line-clamp-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-300">
          {description}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void runAmenities()}
        className="w-full rounded-2xl bg-sky-500/90 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-500/20"
      >
        Auto-fill amenities
      </button>

      {amenities.length > 0 ? (
        <p className="text-center text-xs text-slate-500">{amenities.slice(0, 6).join(" · ")}…</p>
      ) : null}

      <div className="flex gap-3 pt-2">
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
