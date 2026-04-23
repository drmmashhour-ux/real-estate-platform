"use client";

import { useState } from "react";

import { buildCoachingUpliftForecast } from "@/modules/revenue-predictor/revenue-predictor-forecast.service";
import { buildSalespersonPredictorInput, saveRevenueFinancialSnapshot } from "@/modules/revenue-predictor/revenue-predictor-inputs.service";
import {
  estimateOpportunityLoss,
  estimateRiskDownside,
} from "@/modules/revenue-predictor/revenue-predictor-opportunity-loss.service";
import { buildSalespersonRevenueForecast } from "@/modules/revenue-predictor/revenue-predictor.service";
import { CoachingUpliftCard } from "@/modules/revenue-predictor/components/CoachingUpliftCard";
import { ForecastFactorList } from "@/modules/revenue-predictor/components/ForecastFactorList";
import { OpportunityLossCard } from "@/modules/revenue-predictor/components/OpportunityLossCard";
import { RevenueForecastCard } from "@/modules/revenue-predictor/components/RevenueForecastCard";
import { formatCentsAbbrev } from "@/modules/revenue-predictor/components/formatMoney";

export function RevenuePredictorUserPanel({ userId }: { userId: string }) {
  const [tick, setTick] = useState(0);
  void tick;

  const forecast = buildSalespersonRevenueForecast(userId);
  const inp = buildSalespersonPredictorInput(userId);
  const uplift = buildCoachingUpliftForecast(inp, forecast.ranges.baseCents);
  const loss = estimateOpportunityLoss(inp);
  const downside = estimateRiskDownside(inp, forecast.ranges.baseCents);

  const [pipeline, setPipeline] = useState(String(inp.pipelineValueCents / 100));
  const [deal, setDeal] = useState(String(inp.averageDealValueCents / 100));

  return (
    <section className="space-y-6 rounded-xl border border-indigo-900/40 bg-indigo-950/15 p-5">
      <div>
        <h2 className="text-lg font-medium text-indigo-100">Revenue predictor</h2>
        <p className="mt-1 text-xs text-indigo-200/70">
          Probabilistic · uses pipeline snapshot below + AI Sales profile. Refine CRM fields when available.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 md:grid-cols-3">
        <label className="block text-xs text-zinc-500">
          Pipeline value ({formatCentsAbbrev(inp.pipelineValueCents)} current)
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
            inputMode="decimal"
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value)}
          />
        </label>
        <label className="block text-xs text-zinc-500">
          Avg deal value ({formatCentsAbbrev(inp.averageDealValueCents)} current)
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
            inputMode="decimal"
            value={deal}
            onChange={(e) => setDeal(e.target.value)}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
            onClick={() => {
              const pv = Math.round(parseFloat(pipeline || "0") * 100);
              const av = Math.round(parseFloat(deal || "0") * 100);
              saveRevenueFinancialSnapshot({
                userId,
                pipelineValueCents: Number.isFinite(pv) ? pv : 0,
                averageDealValueCents: Number.isFinite(av) ? av : 0,
              });
              setTick((x) => x + 1);
            }}
          >
            Save snapshot
          </button>
        </div>
      </div>

      <RevenueForecastCard forecast={forecast} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CoachingUpliftCard uplift={uplift} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
          <p className="font-medium text-zinc-200">Downside risk (scenario)</p>
          <p className="mt-2 text-lg font-semibold text-rose-300">{formatCentsAbbrev(downside.downsideCents)}</p>
          <p className="mt-2 text-zinc-400">{downside.narrative}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
            {downside.drivers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-600">
            Model downside ~{formatCentsAbbrev(forecast.downsideRiskCents)} (composite from profile).
          </p>
        </div>
      </div>

      <OpportunityLossCard loss={loss} />

      <div>
        <p className="text-sm font-medium text-zinc-300">Why this forecast</p>
        <div className="mt-2">
          <ForecastFactorList explain={forecast.explainability} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">{forecast.explainability.confidenceRationale}</p>
      </div>
    </section>
  );
}
