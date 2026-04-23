"use client";

import { useMemo } from "react";

import { buildMarketDominationSnapshot } from "../market-domination.service";
import { CompetitorPressureCard } from "./CompetitorPressureCard";
import { ExpansionReadinessCard } from "./ExpansionReadinessCard";
import { HubPenetrationMatrix } from "./HubPenetrationMatrix";
import { MarketGapCard } from "./MarketGapCard";
import { MarketRecommendationCard } from "./MarketRecommendationCard";
import { TerritoryScoreCard } from "./TerritoryScoreCard";

type Props = { adminBase: string };

export function MarketDominationDashboardClient({ adminBase }: Props) {
  const snap = useMemo(() => buildMarketDominationSnapshot(), []);

  const matrixRows = useMemo(
    () =>
      snap.territories.map((t) => ({
        territoryId: t.id,
        territoryName: t.name,
        penetration: snap.penetrationByTerritory[t.id] ?? [],
      })),
    [snap]
  );

  const territoryName = (id: string) => snap.territories.find((x) => x.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/90">LECIPM executive</p>
        <h1 className="text-2xl font-semibold text-white">Market domination</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Decision-oriented view: hub penetration, demand/supply gaps, expansion readiness, and manual competitor
          signals. Scores are directional proxies — validate with field intel before major bets.
        </p>
        <p className="text-[11px] text-zinc-600">Generated {new Date(snap.generatedAtIso).toLocaleString()}</p>
      </header>

      {snap.alerts.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Alerts</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {snap.alerts.slice(0, 8).map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  a.severity === "critical"
                    ? "border-rose-700/60 bg-rose-950/40 text-rose-100"
                    : a.severity === "important"
                      ? "border-amber-700/50 bg-amber-950/30 text-amber-50"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-300"
                }`}
              >
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1 opacity-90">{a.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Territory overview</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {snap.territories.map((t) => (
            <TerritoryScoreCard
              key={t.id}
              territory={t}
              domination={snap.dominationByTerritory[t.id]!}
              territoryHref={`${adminBase}/market-domination/${encodeURIComponent(t.id)}`}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Hub penetration grid</h2>
        <HubPenetrationMatrix rows={matrixRows} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Market gaps</h2>
          <div className="grid gap-2">
            {snap.gaps.slice(0, 12).map((g) => (
              <MarketGapCard key={g.id} gap={g} territoryName={territoryName(g.territoryId)} />
            ))}
            {snap.gaps.length === 0 ? (
              <p className="text-sm text-zinc-500">No material gaps flagged with current thresholds.</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Expansion readiness</h2>
          <div className="grid gap-3">
            {snap.territories.map((t) => (
              <ExpansionReadinessCard
                key={t.id}
                readiness={snap.readinessByTerritory[t.id]!}
                territoryName={t.name}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Competitor pressure</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {snap.territories.map((t) => (
            <CompetitorPressureCard
              key={t.id}
              view={snap.competitorByTerritory[t.id]!}
              territoryName={t.name}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Recommended moves</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {snap.recommendations.map((rec) => (
            <MarketRecommendationCard key={rec.id} rec={rec} territoryName={territoryName(rec.territoryId)} />
          ))}
        </div>
      </section>
    </div>
  );
}
