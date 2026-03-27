"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProductHealth } from "@/components/analytics/ProductHealthProvider";
import { track, TrackingEvent } from "@/lib/tracking";
import {
  buildCompareInsightLines,
  computeCompareHighlights,
  dealShortLabel,
  monthlyCashFlowForDeal,
  pickBestInvestmentDealId,
  type DealComparable,
} from "@/lib/investment/compare-insights";
import { getMarketComparisonToneFromString, insightPillClass } from "@/lib/investment/deal-metrics";
import { formatCurrencyCAD, formatRoiPercent } from "@/lib/investment/format";
import { normalizeDealRentalType } from "@/lib/investment/investment-deal-types";
import type { SerializableInvestmentDeal } from "@/lib/investment/investment-deal-types";
import { RENTAL_TYPE, rentalTypeLabel } from "@/lib/investment/rental-model";
import { ShareDealButton } from "@/components/investment/ShareDealButton";
import { UpgradeToProLink } from "@/components/investment/UpgradeToProLink";
import {
  type InvestmentMonetizationSnapshot,
  PRO_VALUE_LINES,
} from "@/lib/investment/monetization";

/** @deprecated use SerializableInvestmentDeal */
export type SerializableDeal = SerializableInvestmentDeal;

const MAX_PICK = 4;
const MIN_PICK = 2;

function asComparable(d: SerializableDeal): DealComparable {
  return {
    id: d.id,
    propertyPrice: d.propertyPrice,
    monthlyRent: d.monthlyRent,
    monthlyExpenses: d.monthlyExpenses,
    roi: d.roi,
    riskScore: d.riskScore,
    nightlyRate: d.nightlyRate ?? null,
    occupancyRate: d.occupancyRate ?? null,
    preferredStrategy: d.preferredStrategy ?? null,
    rentalType: d.rentalType ?? null,
    roiLongTerm: d.roiLongTerm ?? null,
    roiShortTerm: d.roiShortTerm ?? null,
  };
}

export function DealCompareClient({
  deals,
  variant = "live",
  monetization,
}: {
  deals: SerializableInvestmentDeal[];
  variant?: "live" | "demo";
  monetization?: InvestmentMonetizationSnapshot | null;
}) {
  const { highlightCompare } = useProductHealth();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_PICK) return next;
      next.add(id);
      return next;
    });
  }, []);

  const selectedList = useMemo(() => deals.filter((d) => selected.has(d.id)), [deals, selected]);

  const comparableSelected = useMemo(() => selectedList.map(asComparable), [selectedList]);

  const highlights = useMemo(() => computeCompareHighlights(comparableSelected), [comparableSelected]);
  const bestInvestmentId = useMemo(
    () => (selectedList.length >= MIN_PICK ? pickBestInvestmentDealId(comparableSelected) : null),
    [selectedList.length, comparableSelected]
  );
  const insightLines = useMemo(
    () => (selectedList.length >= MIN_PICK ? buildCompareInsightLines(comparableSelected) : []),
    [selectedList.length, comparableSelected]
  );

  const canCompare = selectedList.length >= MIN_PICK && selectedList.length <= MAX_PICK;

  const compareTracked = useRef(false);
  useEffect(() => {
    if (!canCompare || compareTracked.current) return;
    compareTracked.current = true;
    track(TrackingEvent.INVESTMENT_COMPARE_USED, {
      meta: { variant, dealCount: selectedList.length },
    });
    if (process.env.NODE_ENV === "development") {
      console.info("[analytics] investment_compare_used", { variant, dealCount: selectedList.length });
    }
  }, [canCompare, variant, selectedList.length]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Investment MVP</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Compare deals</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Select 2–4 saved analyses to compare side by side. Highlights show best ROI, best monthly cash flow, and lowest risk among your selection.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={variant === "demo" ? "/demo/dashboard" : "/dashboard"}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Dashboard
          </Link>
          <Link href="/analyze" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400">
            Analyze
          </Link>
        </div>
      </div>

      {variant === "demo" ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
          <strong className="text-amber-300">Demo mode:</strong> These deals are sample data stored in your browser. Sign
          in to sync real portfolio data.
        </p>
      ) : null}

      {variant === "live" && monetization && !monetization.isPro ? (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100 sm:px-5">
          <p>
            <strong className="text-white">{PRO_VALUE_LINES.serious}</strong> — {PRO_VALUE_LINES.unlock} Pro unlocks
            unlimited saves and full comparison depth as we ship features.
          </p>
          <p className="mt-2">
            <UpgradeToProLink
              source="compare_banner"
              className="inline-flex rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-bold text-emerald-200 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"
            />
          </p>
        </div>
      ) : null}

      {highlightCompare && deals.length >= MIN_PICK ? (
        <p
          className="rounded-xl border border-amber-500/40 bg-amber-950/35 px-4 py-3 text-sm text-amber-50"
          role="status"
        >
          <strong className="text-amber-200">Compare is powerful:</strong> select 2–4 deals below to see ROI and cash flow
          side by side — many investors miss this step.
        </p>
      ) : null}

      {deals.length < MIN_PICK ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-10 text-center">
          <p className="text-slate-300">You need at least two saved deals to run a comparison.</p>
          <p className="mt-2 text-sm text-slate-500">
            <Link href="/analyze" className="text-emerald-400 underline">
              Analyze and save deals
            </Link>{" "}
            from your dashboard first.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Select deals ({selected.size}/{MAX_PICK})</h2>
            <ul className="mt-4 divide-y divide-white/10">
              {deals.map((d) => {
                const checked = selected.has(d.id);
                const disabled = !checked && selected.size >= MAX_PICK;
                return (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(d.id)}
                      />
                      <span className="font-medium text-white">
                        {d.city} · {formatCurrencyCAD(d.propertyPrice)}
                        {normalizeDealRentalType(d) === RENTAL_TYPE.SHORT_TERM ? (
                          <span className="ml-2 rounded bg-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-200">
                            Short-term
                          </span>
                        ) : null}
                      </span>
                      <span className="text-emerald-400">{formatRoiPercent(d.roi)}</span>
                      <span className="text-slate-500">Risk {d.riskScore}</span>
                    </label>
                    <ShareDealButton dealId={d.id} shareVariant={variant} size="sm" />
                  </li>
                );
              })}
            </ul>
            {selected.size > 0 && selected.size < MIN_PICK && (
              <p className="mt-3 text-sm text-amber-400/90">Select at least {MIN_PICK} deals to see the comparison table.</p>
            )}
          </section>

          {canCompare ? (
            <>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Comparison</h2>
                <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Deal</th>
                        <th className="px-3 py-3">Rental</th>
                        <th className="px-3 py-3">City</th>
                        <th className="px-3 py-3">Property price</th>
                        <th className="px-3 py-3">Monthly cash flow</th>
                        <th className="px-3 py-3">ROI</th>
                        <th className="px-3 py-3">Risk score</th>
                        <th className="px-3 py-3">Market comparison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedList.map((d, idx) => {
                        const cf = monthlyCashFlowForDeal(asComparable(d));
                        const isBestRoi = highlights.bestRoiId === d.id;
                        const isBestCf = highlights.bestMonthlyCfId === d.id;
                        const isLowRisk = highlights.lowestRiskId === d.id;
                        const isBestInv = bestInvestmentId === d.id;
                        const cellGreen = "bg-emerald-500/15 font-semibold text-emerald-200";
                        return (
                          <tr
                            key={d.id}
                            className={`border-b border-white/5 ${isBestInv ? "ring-1 ring-inset ring-emerald-500/40" : ""}`}
                          >
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-white">{dealShortLabel(idx)}</span>
                                {isBestInv ? (
                                  <span className="w-fit rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                                    Best investment
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-slate-300">
                              {rentalTypeLabel(normalizeDealRentalType(d))}
                            </td>
                            <td className="px-3 py-3 text-slate-200">{d.city}</td>
                            <td className="px-3 py-3">{formatCurrencyCAD(d.propertyPrice)}</td>
                            <td className={`px-3 py-3 ${isBestCf ? cellGreen : ""}`}>{formatCurrencyCAD(cf)}</td>
                            <td className={`px-3 py-3 ${isBestRoi ? cellGreen : ""}`}>{formatRoiPercent(d.roi)}</td>
                            <td className={`px-3 py-3 ${isLowRisk ? cellGreen : ""}`}>{d.riskScore}</td>
                            <td className="px-3 py-3">
                              <span className={insightPillClass(getMarketComparisonToneFromString(d.marketComparison))}>{d.marketComparison}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4 md:hidden">
                  {selectedList.map((d, idx) => {
                    const cf = monthlyCashFlowForDeal(asComparable(d));
                    const isBestRoi = highlights.bestRoiId === d.id;
                    const isBestCf = highlights.bestMonthlyCfId === d.id;
                    const isLowRisk = highlights.lowestRiskId === d.id;
                    const isBestInv = bestInvestmentId === d.id;
                    const hi = "rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2 py-1";
                    return (
                      <div
                        key={d.id}
                        className={`rounded-2xl border border-white/10 p-4 ${isBestInv ? "ring-1 ring-emerald-500/50" : "bg-white/[0.03]"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white">{dealShortLabel(idx)}</span>
                          {isBestInv ? (
                            <span className="rounded-full bg-emerald-500/25 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                              Best investment
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-sky-300">{d.city}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Rental: {rentalTypeLabel(normalizeDealRentalType(d))}
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="col-span-2">
                            <dt className="text-slate-500">Property price</dt>
                            <dd>{formatCurrencyCAD(d.propertyPrice)}</dd>
                          </div>
                          <div className={isBestCf ? hi : ""}>
                            <dt className="text-slate-500">Monthly CF</dt>
                            <dd className="font-mono">{formatCurrencyCAD(cf)}</dd>
                          </div>
                          <div className={isBestRoi ? hi : ""}>
                            <dt className="text-slate-500">ROI</dt>
                            <dd className="font-mono">{formatRoiPercent(d.roi)}</dd>
                          </div>
                          <div className={isLowRisk ? hi : ""}>
                            <dt className="text-slate-500">Risk</dt>
                            <dd>{d.riskScore}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-slate-500">Market</dt>
                            <dd>
                              <span className={insightPillClass(getMarketComparisonToneFromString(d.marketComparison))}>{d.marketComparison}</span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })}
                </div>
              </section>

              {insightLines.length > 0 ? (
                <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Quick insights</h2>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-slate-300">
                    {insightLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section
                className="rounded-2xl border border-emerald-500/35 bg-emerald-950/25 px-4 py-4 text-sm text-emerald-100"
                role="status"
              >
                <p className="font-semibold text-white">Show this comparison to someone</p>
                <p className="mt-1 text-xs text-emerald-200/85">
                  One tap copies a message with a public link for each selected deal (no login required to view).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedList.map((d) => (
                    <ShareDealButton key={`share-${d.id}`} dealId={d.id} shareVariant={variant} size="sm" />
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
