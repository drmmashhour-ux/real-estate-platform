"use client";

import * as React from "react";
import type { GrowthLearningCycleResult } from "@/modules/growth/growth-learning.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { applyPolicyToLearning } from "@/modules/growth/growth-policy-enforcement-bridge.service";
import { GrowthGovernancePolicyDomainBadge } from "./GrowthGovernancePolicyDomainBadge";

export function GrowthLearningPanel({
  policyBadgeEnabled,
  enforcementSnapshot,
  decisionJournalBridge,
}: {
  policyBadgeEnabled?: boolean;
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
  /** When true, show compact decision-journal bridge lines (requires journal + bridge flags server-side). */
  decisionJournalBridge?: boolean;
}) {
  const [data, setData] = React.useState<GrowthLearningCycleResult | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [journalInsights, setJournalInsights] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (!decisionJournalBridge) {
      setJournalInsights(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/growth/decision-journal", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return null;
        const j = (await r.json()) as { insights?: string[] };
        return j.insights ?? [];
      })
      .then((lines) => {
        if (!cancelled) setJournalInsights(lines?.length ? lines.slice(0, 2) : null);
      })
      .catch(() => {
        if (!cancelled) setJournalInsights(null);
      });
    return () => {
      cancelled = true;
    };
  }, [decisionJournalBridge]);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/learning", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Learning load failed");
        return j as GrowthLearningCycleResult;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const learnGate = React.useMemo(
    () => applyPolicyToLearning(enforcementSnapshot ?? null),
    [enforcementSnapshot],
  );

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Loading growth learning…</p>;

  const { summary, weights } = data;
  const adj = summary.adjustmentsApplied.slice(-4);

  return (
    <div className="rounded-xl border border-violet-900/45 bg-violet-950/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-violet-100">🧠 Growth Learning</h3>
        <GrowthGovernancePolicyDomainBadge domain="learning" enabled={policyBadgeEnabled} />
        {learnGate.note ? (
          <span className="rounded-full border border-amber-600/45 bg-amber-950/35 px-2 py-0.5 text-[10px] text-amber-100/95">
            Policy: {learnGate.note}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Local orchestration weights only — does not modify CRM, Stripe, ads APIs, or CRO experiments.
      </p>

      <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
        <p>
          Runs (cycle index): <strong className="text-zinc-200">{summary.runs}</strong>
        </p>
        <p>
          Outcomes linked: <strong className="text-zinc-200">{summary.outcomesLinked}</strong> /{" "}
          {summary.signalsEvaluated} evaluated
        </p>
        <p>
          Positive rate: <strong className="text-emerald-300/90">{(summary.positiveRate * 100).toFixed(0)}%</strong>
        </p>
        <p>
          Negative rate: <strong className="text-rose-300/90">{(summary.negativeRate * 100).toFixed(0)}%</strong>
        </p>
        <p>
          Neutral rate: <strong className="text-zinc-300">{(summary.neutralRate * 100).toFixed(0)}%</strong>
        </p>
      </div>

      <div className="mt-4 border-t border-violet-900/40 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Weight status</p>
        <p className="mt-1 text-xs text-zinc-500">
          Adaptive nudges:{" "}
          <strong className="text-zinc-200">{data.adaptiveWeightsEnabled ? "enabled" : "disabled"}</strong>
          {" · "}
          Monitoring: <strong className="text-zinc-200">{data.monitoringEnabled ? "on" : "off"}</strong>
        </p>
        <ul className="mt-2 grid gap-1 font-mono text-[11px] text-violet-200/80 sm:grid-cols-2">
          <li>impact: {weights.impactWeight.toFixed(3)}</li>
          <li>confidence: {weights.confidenceWeight.toFixed(3)}</li>
          <li>signalStrength: {weights.signalStrengthWeight.toFixed(3)}</li>
          <li>recency: {weights.recencyWeight.toFixed(3)}</li>
          <li>governancePenalty: {weights.governancePenaltyWeight.toFixed(3)}</li>
          <li>defaultBias: {weights.defaultBiasWeight.toFixed(3)}</li>
        </ul>
        <p className="mt-1 text-[10px] text-zinc-600">Updated {weights.updatedAt}</p>
      </div>

      <div className="mt-4 border-t border-violet-900/40 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Recent adjustments</p>
        {adj.length === 0 ? (
          <p className="mt-1 text-xs text-zinc-600">None in this snapshot.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {adj.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </div>

      {summary.warnings.length > 0 ? (
        <div className="mt-3 rounded border border-amber-500/30 bg-amber-950/20 px-2 py-2 text-xs text-amber-100/90">
          <p className="font-semibold text-amber-200/90">Warnings</p>
          <ul className="mt-1 list-inside list-disc text-amber-100/80">
            {summary.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {journalInsights && journalInsights.length > 0 ? (
        <div className="mt-3 rounded border border-sky-800/40 bg-sky-950/20 px-2 py-2 text-[11px] text-sky-100/90">
          <p className="font-semibold text-sky-200/90">Decision journal (advisory)</p>
          <ul className="mt-1 list-inside list-disc text-sky-100/85">
            {journalInsights.map((line, i) => (
              <li key={`dj-${i}`}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-[11px] text-zinc-600">
        Safety: local growth scoring only — does not modify source-system logic.
      </p>
    </div>
  );
}
