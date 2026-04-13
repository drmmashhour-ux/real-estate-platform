"use client";

import { useState } from "react";

export type AiListingDraftPanelProps = {
  address: string;
  city: string;
  region: string;
  country: string;
  propertyType: string;
  roomType: string;
  beds: string;
  baths: string;
  maxGuests: string;
  /** Same as wizard: cents as string */
  nightPriceCents: string;
  onApply: (patch: { title: string; description: string; amenities: string }) => void;
};

/**
 * Calls POST /api/bnhub/listings/ai-draft (no DB write). Host edits fields below; publish only on Review.
 */
export function AiListingDraftPanel({
  address,
  city,
  region,
  country,
  propertyType,
  roomType,
  beds,
  baths,
  maxGuests,
  nightPriceCents,
  onApply,
}: AiListingDraftPanelProps) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sourceHint, setSourceHint] = useState<string | null>(null);

  async function generate() {
    setErr("");
    setSourceHint(null);
    const cents = Number(nightPriceCents);
    if (!address.trim() || !city.trim() || !Number.isFinite(cents) || cents < 100) {
      setErr(
        "Fill Location (address + city) and Pricing (nightly rate at least $1) first, or we cannot build a draft."
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/bnhub/listings/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          region: region.trim(),
          country: country.trim() || "US",
          propertyType,
          roomType,
          beds,
          baths,
          maxGuests,
          nightPriceCents: Math.round(cents),
          notes: notes.trim() || undefined,
        }),
      });
      const out = (await res.json()) as { error?: string; title?: string; description?: string; amenities?: string[]; source?: string };
      if (!res.ok) throw new Error(out.error ?? "Could not generate draft");
      onApply({
        title: out.title ?? "",
        description: out.description ?? "",
        amenities: Array.isArray(out.amenities) ? out.amenities.join(", ") : "",
      });
      setSourceHint(
        out.source === "openai"
          ? "Draft generated with AI — review and edit before publishing."
          : "Template draft (configure OPENAI_API_KEY for richer copy) — review every line before publishing."
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-emerald-200">AI listing draft</h3>
          <p className="mt-1 text-xs text-slate-400">
            Uses your basics, location, and nightly price. Nothing goes live until you submit on Review — edit everything
            below.
          </p>
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs text-slate-400">Optional hints for the draft (pets, parking, view…)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Free street parking, no pets, quiet building"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={busy}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Fill title, description & amenities"}
        </button>
        {sourceHint ? <p className="text-xs text-emerald-300/90">{sourceHint}</p> : null}
      </div>
      {err ? <p className="mt-2 text-xs text-red-400">{err}</p> : null}
    </div>
  );
}
