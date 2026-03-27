"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Rec = {
  listingId: string;
  title: string;
  city: string;
  nightPriceCents: number;
  score: number;
  explanation: string;
};

type Hints = {
  suggestedLocations: string[];
  suggestedPriceRangeCents: { min: number; max: number } | null;
  explanation: string;
};

export function RecommendedForYou({
  accent = "#10b981",
  textColor = "#e2e8f0",
}: {
  accent?: string;
  textColor?: string;
}) {
  const [items, setItems] = useState<Rec[]>([]);
  const [hints, setHints] = useState<Hints | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/recommendations/for-you?limit=6", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          setErr("signin");
          return;
        }
        const d = await r.json().catch(() => ({}));
        setItems(Array.isArray(d.recommendations) ? d.recommendations : []);
        if (d.preferenceHints && typeof d.preferenceHints === "object") {
          setHints(d.preferenceHints as Hints);
        }
      })
      .catch(() => setItems([]));
  }, []);

  if (err === "signin") return null;
  if (items.length === 0 && !hints?.suggestedLocations?.length) return null;

  return (
    <section className="ai-panel-premium p-6">
      <h2 className="mb-1 text-lg font-semibold" style={{ color: textColor }}>
        Recommended for you
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Based on your recent activity (rule-based — not ML).{" "}
        <Link href="/search/bnhub" className="underline" style={{ color: accent }}>
          Browse all stays
        </Link>
      </p>
      {hints && (hints.suggestedLocations.length > 0 || hints.suggestedPriceRangeCents) && (
        <div className="mb-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
          <p className="font-medium text-slate-300">Your signals</p>
          {hints.suggestedLocations.length > 0 && (
            <p className="mt-1">
              <span className="text-slate-500">Locations: </span>
              {hints.suggestedLocations.join(", ")}
            </p>
          )}
          {hints.suggestedPriceRangeCents && (
            <p className="mt-1">
              <span className="text-slate-500">Price band (nightly): </span>$
              {(hints.suggestedPriceRangeCents.min / 100).toFixed(0)} – $
              {(hints.suggestedPriceRangeCents.max / 100).toFixed(0)}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">{hints.explanation}</p>
        </div>
      )}
      <ul className="space-y-3">
        {items.map((r) => (
          <li
            key={r.listingId}
            className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
          >
            <div>
              <p className="font-medium text-slate-100">{r.title}</p>
              <p className="text-sm text-slate-400">
                {r.city} · {(r.nightPriceCents / 100).toFixed(0)} / night
              </p>
              <p className="mt-1 text-xs text-slate-500">{r.explanation}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link
                href={`/bnhub/${r.listingId}`}
                className="rounded-lg px-3 py-1.5 text-center text-sm font-medium text-black"
                style={{ background: accent }}
              >
                View listing
              </Link>
              <Link
                href={`/search/bnhub?city=${encodeURIComponent(r.city)}`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-center text-sm text-slate-200 hover:bg-white/5"
              >
                Same area
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
