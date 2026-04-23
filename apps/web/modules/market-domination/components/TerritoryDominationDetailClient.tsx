"use client";

import Link from "next/link";
import { useMemo } from "react";

import { getTerritoryDetail } from "../market-domination.service";
import { CompetitorPressureCard } from "./CompetitorPressureCard";
import { ExpansionReadinessCard } from "./ExpansionReadinessCard";
import { HubPenetrationMatrix } from "./HubPenetrationMatrix";
import { MarketGapCard } from "./MarketGapCard";
import { MarketRecommendationCard } from "./MarketRecommendationCard";
import { TerritoryTrendChart } from "./TerritoryTrendChart";
import { explainRecommendation } from "../market-domination-explainability.service";

type Props = { territoryId: string; adminBase: string };

export function TerritoryDominationDetailClient({ territoryId, adminBase }: Props) {
  const detail = useMemo(() => getTerritoryDetail(territoryId), [territoryId]);

  if (!detail?.territory) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-zinc-400">Territory not found.</p>
        <Link href={`${adminBase}/market-domination`} className="mt-4 inline-block text-amber-300 underline">
          Back to overview
        </Link>
      </div>
    );
  }

  const t = detail.territory;
  const sampleRec = detail.readiness
    ? {
        id: `detail-${t.id}`,
        action: detail.readiness.recommendedEntryStrategy,
        territoryId: t.id,
        targetHub: detail.explainability?.leadingHub ?? "BUYER",
        expectedImpact: "medium" as const,
        urgency: detail.readiness.band === "PRIORITY" ? ("high" as const) : ("medium" as const),
        confidence: 0.5,
        explanation: detail.explainability?.whyActNow ?? "",
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{t.scope}</p>
          <h1 className="text-2xl font-semibold text-white">{t.name}</h1>
          <p className="text-sm text-zinc-500">{t.regionLabel}</p>
        </div>
        <Link
          href={`${adminBase}/market-domination`}
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:border-amber-500/50"
        >
          ← Overview
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Domination score</p>
          <p className="text-3xl font-semibold text-amber-100">{detail.domination?.score ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Trend</p>
          <p className="text-lg text-white">{detail.domination?.trend ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Supply / demand proxy</p>
          <p className="text-lg font-mono text-zinc-200">{t.metrics.supplyDemandRatio.toFixed(2)}</p>
        </div>
      </div>

      <TerritoryTrendChart points={detail.trendHistory} />

      {detail.readiness ? (
        <ExpansionReadinessCard readiness={detail.readiness} territoryName={t.name} />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Hub penetration</h2>
        <HubPenetrationMatrix
          rows={[{ territoryId: t.id, territoryName: t.name, penetration: detail.penetration }]}
        />
      </section>

      {detail.competitor ? <CompetitorPressureCard view={detail.competitor} territoryName={t.name} /> : null}

      {detail.explainability ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-sm text-zinc-300">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Explainability</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {detail.explainability.scoreDrivers.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-rose-200/90">
            Weak spots: {detail.explainability.weakeners.join("; ") || "—"}
          </p>
          <p className="mt-2 text-xs text-sky-200/90">Why act: {detail.explainability.whyActNow}</p>
          <p className="mt-2 text-xs text-violet-200/90">Lead hub: {detail.explainability.leadingHub}</p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Gaps for this territory</h2>
        <div className="grid gap-2">
          {detail.gaps.map((g) => (
            <MarketGapCard key={g.id} gap={g} />
          ))}
          {detail.gaps.length === 0 ? (
            <p className="text-sm text-zinc-500">No gap rules fired for this slice.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Recommended focus</h2>
        {sampleRec ? (
          <>
            <MarketRecommendationCard rec={sampleRec} territoryName={t.name} />
            <p className="text-[11px] text-zinc-600">{explainRecommendation(sampleRec)}</p>
          </>
        ) : null}
      </section>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-400">Revenue & demand (proxies)</p>
        <p className="mt-2 font-mono text-zinc-400">
          revenue ≈ {(t.metrics.revenueCents / 100).toLocaleString()} CAD · leads {t.metrics.leadVolume} · bookings{" "}
          {t.metrics.bookingVolume}
        </p>
      </div>
    </div>
  );
}
