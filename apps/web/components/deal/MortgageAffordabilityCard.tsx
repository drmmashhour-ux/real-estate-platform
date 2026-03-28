"use client";

import { useCallback, useEffect, useState } from "react";
import type { AffordabilityPublicDto } from "@/modules/deal-analyzer/domain/contracts";

type Props = {
  listingId: string;
  priceCents: number;
  enabled: boolean;
};

export function MortgageAffordabilityCard({ listingId, priceCents, enabled }: Props) {
  const [dto, setDto] = useState<AffordabilityPublicDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [downPct, setDownPct] = useState("20");
  const [ratePct, setRatePct] = useState("6.5");
  const [years, setYears] = useState("25");
  const [income, setIncome] = useState("");
  const [debts, setDebts] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/affordability`, {
      credentials: "include",
    });
    if (res.status === 503) return;
    const j = (await res.json()) as { affordability?: AffordabilityPublicDto | null };
    setDto(j.affordability ?? null);
  }, [listingId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const downPctN = Number(downPct);
      const downPaymentCents =
        priceCents > 0 && !Number.isNaN(downPctN) ? Math.round((priceCents * downPctN) / 100) : null;

      const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/affordability/run`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downPaymentCents,
          annualRate: Number(ratePct) / 100,
          termYears: Number(years),
          monthlyIncomeCents: income.trim() ? Math.round(Number(income) * 100) : null,
          monthlyDebtsCents: debts.trim() ? Math.round(Number(debts) * 100) : null,
        }),
      });
      const j = (await res.json()) as { affordability?: AffordabilityPublicDto | null; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not run affordability check");
        return;
      }
      setDto(j.affordability ?? null);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Mortgage affordability (illustrative)</p>
      <p className="mt-2 text-xs text-slate-500">
        Estimated payment and ratios only — not a lender approval or pre-qualification.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Down payment %
          <input
            type="text"
            inputMode="decimal"
            value={downPct}
            onChange={(e) => setDownPct(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Interest rate % (annual)
          <input
            type="text"
            inputMode="decimal"
            value={ratePct}
            onChange={(e) => setRatePct(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Amortization (years)
          <input
            type="text"
            inputMode="numeric"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Gross monthly income (CAD)
          <input
            type="text"
            inputMode="decimal"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            placeholder="Optional"
          />
        </label>
        <label className="block text-xs text-slate-400 sm:col-span-2">
          Monthly debt payments (CAD)
          <input
            type="text"
            inputMode="decimal"
            value={debts}
            onChange={(e) => setDebts(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            placeholder="Optional"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="mt-4 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? "Calculating…" : "Estimate affordability"}
      </button>
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
      {dto ? (
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Level:</span>{" "}
            <span className="font-medium text-white">{dto.affordabilityLevel.replace(/_/g, " ")}</span>
            {" · "}
            <span className="text-slate-500">Confidence:</span>{" "}
            <span className="text-amber-200/90">{dto.confidenceLevel}</span>
          </p>
          {dto.estimatedMonthlyPaymentCents != null ? (
            <p className="font-mono text-xs text-slate-400">
              Est. principal &amp; interest: ${(dto.estimatedMonthlyPaymentCents / 100).toLocaleString()} / mo
            </p>
          ) : null}
          {dto.affordabilityRatio != null ? (
            <p className="text-xs text-slate-400">
              Approx. housing + debts to income: {(dto.affordabilityRatio * 100).toFixed(1)}%
            </p>
          ) : null}
          {dto.warnings.map((w) => (
            <p key={w.slice(0, 48)} className="text-xs text-amber-200/80">
              {w}
            </p>
          ))}
          {dto.explanation ? <p className="text-xs text-slate-500">{dto.explanation}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Enter assumptions and run an illustrative check.</p>
      )}
    </div>
  );
}
