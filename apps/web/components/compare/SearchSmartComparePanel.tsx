"use client";

import { useMemo, useState } from "react";

export type SearchSmartCompareRow = {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  transactionFlag?: {
    key: "offer_received" | "offer_accepted" | "sold";
    label: string;
  } | null;
};

type CompareMode = "best_value" | "family_fit" | "lowest_competition";

function normalize(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (value: number) => {
    if (max === min) return 1;
    return (value - min) / (max - min);
  };
}

function modeLabel(mode: CompareMode) {
  switch (mode) {
    case "best_value":
      return "Best value";
    case "family_fit":
      return "Best family fit";
    case "lowest_competition":
      return "Lowest competition";
  }
}

export function SearchSmartComparePanel({
  rows,
  selectedIds,
  onRemove,
  onClear,
}: {
  rows: SearchSmartCompareRow[];
  selectedIds: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [mode, setMode] = useState<CompareMode>("best_value");

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds]
  );

  const scored = useMemo(() => {
    if (selectedRows.length === 0) return [];

    const priceNorm = normalize(selectedRows.map((row) => row.priceCents));
    const bedroomNorm = normalize(selectedRows.map((row) => row.bedrooms ?? 0));
    const bathroomNorm = normalize(selectedRows.map((row) => row.bathrooms ?? 0));

    return selectedRows
      .map((row) => {
        const priceScore = 1 - priceNorm(row.priceCents);
        const bedScore = bedroomNorm(row.bedrooms ?? 0);
        const bathScore = bathroomNorm(row.bathrooms ?? 0);
        const familyScore =
          bedScore * 0.45 +
          bathScore * 0.2 +
          (row.familyFriendly ? 0.25 : 0) +
          (row.petsAllowed ? 0.1 : 0);
        const competitionPenalty =
          row.transactionFlag?.key === "sold"
            ? 1
            : row.transactionFlag?.key === "offer_accepted"
              ? 0.75
              : row.transactionFlag?.key === "offer_received"
                ? 0.35
                : 0;
        const competitionScore = 1 - competitionPenalty;

        const score =
          mode === "best_value"
            ? priceScore * 0.6 + bedScore * 0.2 + bathScore * 0.1 + competitionScore * 0.1
            : mode === "family_fit"
              ? familyScore * 0.75 + competitionScore * 0.15 + priceScore * 0.1
              : competitionScore * 0.7 + priceScore * 0.2 + bedScore * 0.1;

        const reasons: string[] = [];
        if (mode === "best_value") {
          if (priceScore > 0.66) reasons.push("Strong price positioning versus selected listings.");
          if (bedScore > 0.66) reasons.push("Offers more bedroom value inside this comparison.");
          if (competitionScore > 0.8) reasons.push("Lower current competition signal than the other options.");
        } else if (mode === "family_fit") {
          if (row.familyFriendly) reasons.push("Marked as family-friendly.");
          if ((row.bedrooms ?? 0) >= 3) reasons.push("Bedroom count fits a larger household.");
          if (row.petsAllowed) reasons.push("Pet-friendly signal can improve daily usability.");
        } else {
          if (!row.transactionFlag) reasons.push("No active negotiation-stage flag detected.");
          if (competitionScore > 0.8) reasons.push("Looks more available than the other compared listings.");
          if (priceScore > 0.5) reasons.push("Still holds a reasonable value position.");
        }

        if (reasons.length === 0) {
          reasons.push("Balanced option across the selected listings.");
        }

        return {
          row,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [mode, selectedRows]);

  const winner = scored[0];

  if (selectedRows.length < 2) return null;

  return (
    <section className="rounded-3xl border border-premium-gold/20 bg-[#0b0b0b] p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Smart compare</p>
          <h3 className="mt-2 text-2xl font-bold text-white">AI-style shortlist recommendation</h3>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Compare selected offers directly inside search and surface the strongest option by value, family fit, or
            competition level.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-premium-gold/40 hover:text-white"
        >
          Clear selection
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["best_value", "family_fit", "lowest_competition"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === option
                ? "bg-premium-gold text-black"
                : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-premium-gold/30"
            }`}
          >
            {modeLabel(option)}
          </button>
        ))}
      </div>

      {winner ? (
        <div className="mt-5 rounded-2xl border border-premium-gold/30 bg-premium-gold/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Top pick</p>
          <h4 className="mt-2 text-xl font-bold text-white">{winner.row.title}</h4>
          <p className="mt-1 text-sm text-slate-300">
            {winner.row.city} · ${(winner.row.priceCents / 100).toLocaleString("en-CA")}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-200">
            {winner.reasons.map((reason) => (
              <li key={reason}>- {reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {scored.map(({ row, score, reasons }, index) => (
          <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rank #{index + 1}</p>
                <h5 className="mt-2 font-semibold text-white">{row.title}</h5>
                <p className="mt-1 text-sm text-slate-400">
                  {row.city} · ${(row.priceCents / 100).toLocaleString("en-CA")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                className="text-xs font-semibold text-slate-500 hover:text-white"
              >
                Remove
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-premium-gold">Score {Math.round(score * 100)}/100</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {reasons.slice(0, 3).map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
