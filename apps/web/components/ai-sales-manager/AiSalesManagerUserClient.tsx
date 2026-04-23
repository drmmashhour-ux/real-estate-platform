"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  buildSalespersonDetailPayload,
  refreshUserIntelligence,
} from "@/modules/ai-sales-manager/ai-sales-manager.service";
import {
  assignRecommendedScenarios,
  buildPostCallCoachingSummary,
  buildLiveCallPrecallBrief,
} from "@/modules/ai-sales-manager/ai-sales-integration.service";
import { updateManagerNotes } from "@/modules/ai-sales-manager/ai-sales-profile.service";
import { RevenuePredictorUserPanel } from "@/components/revenue-predictor/RevenuePredictorUserPanel";

export function AiSalesManagerUserClient({
  userId,
  adminBase,
}: {
  userId: string;
  adminBase: string;
}) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);
  void tick;
  const bundle = buildSalespersonDetailPayload(userId);
  const preCall = buildLiveCallPrecallBrief(userId);
  const [notes, setNotes] = useState(bundle.profile.managerNotes);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 text-zinc-100">
      <nav className="text-sm text-zinc-500">
        <Link href={`${adminBase}/ai-sales-manager`} className="text-amber-400 hover:text-amber-300">
          ← AI Sales Manager
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold">{bundle.profile.displayName ?? bundle.profile.userId}</h1>
        <p className="mt-1 text-sm text-zinc-500">Composite {bundle.scores.overall} · confidence {bundle.scores.confidence}</p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Score breakdown</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {bundle.scores.factors.map((f) => (
            <li key={f.label} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
              <span className="font-medium text-zinc-200">{f.label}</span> · contribution {f.contribution}{" "}
              <span className="text-zinc-500">({f.explanation})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Strengths & weaknesses</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-xs uppercase text-emerald-500">Strengths</p>
            <ul className="mt-2 list-inside list-disc text-zinc-400">
              {bundle.coaching.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-rose-400">Weaknesses</p>
            <ul className="mt-2 list-inside list-disc text-zinc-400">
              {bundle.coaching.weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Recommended scenarios & actions</h2>
        <ul className="mt-4 space-y-4">
          {bundle.recommendations.map((r) => (
            <li key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-sm">
              <p className="font-medium text-zinc-100">{r.title}</p>
              <p className="mt-1 text-zinc-400">{r.reason}</p>
              <p className="mt-1 text-xs text-amber-200/80">Target: {r.expectedImprovementArea}</p>
              <p className="mt-1 text-xs text-zinc-500">Scenarios: {r.suggestedScenarioIds.join(", ") || "—"}</p>
              <p className="mt-1 text-xs text-zinc-600">Triggers: {r.triggers.map((t) => `${t.label}=${t.value}`).join("; ")}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950"
          onClick={() => {
            assignRecommendedScenarios(userId);
            refresh();
          }}
        >
          Record scenario assignment (explainable log)
        </button>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Strategies</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {bundle.strategies.map((s) => (
            <li key={s.id} className="rounded-lg border border-zinc-800 px-3 py-2">
              <p className="font-medium text-zinc-100">{s.title}</p>
              <p className="text-zinc-400">{s.explanation}</p>
              <p className="mt-1 text-xs text-zinc-500">When: {s.whenToUse}</p>
              <p className="mt-2 text-emerald-200/90">&quot;{s.exampleLine}&quot;</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Forecast</h2>
        <div className="mt-3 space-y-3 text-sm text-zinc-400">
          <p>{bundle.forecast.current.narrative}</p>
          <p>
            <span className="text-zinc-300">Best case:</span> {bundle.forecast.bestCase.narrative}
          </p>
          <p>
            <span className="text-zinc-300">If coaching followed:</span> {bundle.forecast.ifCoachingFollowed.narrative}
          </p>
          <p className="text-xs text-zinc-600">Risks: {bundle.forecast.current.riskFactors.join("; ") || "—"}</p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Live call center · precall brief</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
          {preCall.watchouts.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-zinc-600">{preCall.explainability}</p>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Post-call coaching snippet</h2>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300">
          {buildPostCallCoachingSummary(userId)}
        </pre>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Alerts (recent)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {bundle.alerts.map((a) => (
            <li key={a.alertId} className="text-zinc-400">
              <span className="text-zinc-200">{a.title}</span> — {a.body}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Manager notes</h2>
        <textarea
          className="mt-3 min-h-[100px] w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
          onClick={() => {
            updateManagerNotes(userId, notes);
            refresh();
          }}
        >
          Save notes
        </button>
      </section>

      <RevenuePredictorUserPanel userId={userId} />

      <button
        type="button"
        className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200"
        onClick={() => {
          refreshUserIntelligence(userId);
          refresh();
        }}
      >
        Refresh intelligence & alerts
      </button>
    </div>
  );
}
