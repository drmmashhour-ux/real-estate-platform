"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  buildOrganizationRevenueRollup,
  buildPipelineForecast,
} from "@/modules/revenue-predictor/revenue-predictor.service";
import { evaluateRevenuePredictorAlerts } from "@/modules/revenue-predictor/revenue-predictor-alerts.service";
import { buildTeamRevenueForecast, rankCoachingByRevenueImpact } from "@/modules/revenue-predictor/revenue-predictor-team.service";
import { buildSalespersonPredictorInput } from "@/modules/revenue-predictor/revenue-predictor-inputs.service";
import {
  estimateOpportunityLoss,
} from "@/modules/revenue-predictor/revenue-predictor-opportunity-loss.service";
import { ForecastFactorList } from "@/modules/revenue-predictor/components/ForecastFactorList";
import { OpportunityLossCard } from "@/modules/revenue-predictor/components/OpportunityLossCard";
import { RevenueRangeCard } from "@/modules/revenue-predictor/components/RevenueRangeCard";
import { SalespersonForecastTable } from "@/modules/revenue-predictor/components/SalespersonForecastTable";
import { StageRevenueTable } from "@/modules/revenue-predictor/components/StageRevenueTable";
import { formatCentsAbbrev } from "@/modules/revenue-predictor/components/formatMoney";
import {
  buildCoachingUpliftForecast,
  computeBaseExpectedRevenueCents,
  computeWeightedCloseProbability,
} from "@/modules/revenue-predictor/revenue-predictor-forecast.service";
import { listSalesProfiles } from "@/modules/ai-sales-manager/ai-sales-profile.service";
import { listTeams } from "@/modules/team-training/team.service";

export function RevenuePredictorDashboardClient({ adminBase }: { adminBase: string }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);
  void tick;

  const rollup = buildOrganizationRevenueRollup();
  const pipeline = buildPipelineForecast({});
  const alerts = evaluateRevenuePredictorAlerts().slice(0, 12);
  const teams = listTeams();
  const coachingRank = rankCoachingByRevenueImpact();

  const repRows = listSalesProfiles().map((p) => {
    const inp = buildSalespersonPredictorInput(p.userId);
    const prob = computeWeightedCloseProbability(inp);
    const base = computeBaseExpectedRevenueCents(inp, prob);
    const uplift = buildCoachingUpliftForecast(inp, base);
    return {
      userId: p.userId,
      displayName: p.displayName,
      base,
      trend: p.improvementTrend,
      uplift,
    };
  });

  const firstUserId = listSalesProfiles()[0]?.userId;
  const lossDemo = estimateOpportunityLoss(buildSalespersonPredictorInput(firstUserId ?? "_empty"));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">LECIPM · Forecasting</p>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue predictor</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Operational ranges tied to pipeline snapshots and sales performance signals.{" "}
          <strong className="text-zinc-200">Not guarantees — managers validate assumptions.</strong>
        </p>
      </header>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200"
          onClick={() => refresh()}
        >
          Refresh
        </button>
        <Link href={`${adminBase}/ai-sales-manager`} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-amber-400">
          AI Sales Manager →
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RevenueRangeCard
          title="Organization (summed reps)"
          subtitle={`${rollup.repCount} profiles · directional`}
          ranges={rollup.ranges}
        />
        <RevenueRangeCard
          title="Pipeline snapshot (stored stages)"
          subtitle="From revenue predictor snapshots"
          ranges={pipeline.ranges}
        />
      </section>

      <section>
        <h2 className="text-lg font-medium">Team revenue forecast</h2>
        <div className="mt-4 space-y-6">
          {teams.map((t) => {
            const tf = buildTeamRevenueForecast(t.teamId);
            if (!tf) return null;
            return (
              <div key={t.teamId} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                <p className="font-medium text-zinc-100">{t.name}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                  <span className="text-zinc-400">
                    Conservative: <strong className="text-zinc-200">{formatCentsAbbrev(tf.ranges.conservativeCents)}</strong>
                  </span>
                  <span className="text-zinc-400">
                    Base: <strong className="text-amber-200">{formatCentsAbbrev(tf.ranges.baseCents)}</strong>
                  </span>
                  <span className="text-zinc-400">
                    Upside: <strong className="text-emerald-200">{formatCentsAbbrev(tf.ranges.upsideCents)}</strong>
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{tf.explainability.confidenceRationale}</p>
                <div className="mt-4">
                  <SalespersonForecastTable members={tf.memberForecasts} adminBase={adminBase} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Revenue by salesperson</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Rep</th>
                <th className="px-3 py-2">Base</th>
                <th className="px-3 py-2">Trend</th>
                <th className="px-3 py-2">Coaching uplift</th>
              </tr>
            </thead>
            <tbody>
              {repRows.map((r) => (
                <tr key={r.userId} className="border-b border-zinc-800/80">
                  <td className="px-3 py-2">
                    <Link className="text-amber-400" href={`${adminBase}/ai-sales-manager/${encodeURIComponent(r.userId)}`}>
                      {r.displayName ?? r.userId.slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{formatCentsAbbrev(r.base)}</td>
                  <td className="px-3 py-2 text-zinc-400">{r.trend}</td>
                  <td className="px-3 py-2 text-zinc-300">
                    {formatCentsAbbrev(r.uplift.potentialUpliftCents)} ({Math.round(r.uplift.upliftLowPct * 100)}–
                    {Math.round(r.uplift.upliftHighPct * 100)}% band)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <OpportunityLossCard loss={lossDemo} />
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Pipeline heatmap / leakage</h2>
          <StageRevenueTable loss={lossDemo} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Coaching uplift priorities (revenue-weighted)</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {coachingRank.slice(0, 8).map((r) => (
            <li key={r.userId}>
              <Link className="text-amber-400" href={`${adminBase}/ai-sales-manager/${encodeURIComponent(r.userId)}`}>
                {r.userId.slice(0, 10)}
              </Link>{" "}
              — score {Math.round(r.score)} · {r.note}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium">Explainability — pipeline rollup</h2>
        <ForecastFactorList explain={pipeline.explainability} />
      </section>

      <section>
        <h2 className="text-lg font-medium">Alerts</h2>
        <ul className="mt-3 space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400">
              <span className="text-zinc-200">{a.title}</span> — {a.body}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
