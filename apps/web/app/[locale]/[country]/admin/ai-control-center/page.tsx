"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAiLogs,
  getAiEvaluations,
  getFraudAlerts,
  getPricingSuggestions,
  getTrustScores,
} from "@/lib/ai/client";
import { AiStatCard } from "@/components/ai/AiStatCard";
import { AiFraudAlertsTable } from "@/components/ai/AiFraudAlertsTable";
import { AiPricingTable } from "@/components/ai/AiPricingTable";
import { AiTrustTable } from "@/components/ai/AiTrustTable";
import { AiDecisionLogTable } from "@/components/ai/AiDecisionLogTable";
import type { AiLogsResponse, FraudAlertItem, PricingSuggestionItem, AiLogEntry } from "@/lib/ai/client";

type HubAiInteractionRow = {
  id: string;
  hub: string;
  feature: string;
  intent: string;
  role: string;
  source: string;
  createdAt: string;
};

export default function AiControlCenterPage() {
  const [summary, setSummary] = useState<AiLogsResponse["summary"]>({
    totalEvaluations: 0,
    flaggedRisks: 0,
    avgTrustScore: null,
    totalLogs: 0,
  });
  const [evaluations, setEvaluations] = useState<AiLogEntry[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlertItem[]>([]);
  const [pricingSuggestions, setPricingSuggestions] = useState<PricingSuggestionItem[]>([]);
  const [trustScores, setTrustScores] = useState<AiLogEntry[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<AiLogEntry[]>([]);
  const [hubAiLogs, setHubAiLogs] = useState<HubAiInteractionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [logsRes, evals, alerts, pricing, trust] = await Promise.all([
        getAiLogs({ limit: 100 }),
        getAiEvaluations(50),
        getFraudAlerts(),
        getPricingSuggestions(30),
        getTrustScores(50),
      ]);
      setSummary(logsRes.summary);
      setEvaluations(Array.isArray(evals) ? evals : []);
      setFraudAlerts(Array.isArray(alerts) ? alerts : []);
      setPricingSuggestions(Array.isArray(pricing) ? pricing : []);
      setTrustScores(Array.isArray(trust) ? trust : []);
      setDecisionLogs(Array.isArray(logsRes.logs) ? logsRes.logs : []);
      try {
        const hubRes = await fetch("/api/admin/ai-interactions?take=30", { credentials: "same-origin" });
        const hubJson = await hubRes.json().catch(() => ({}));
        setHubAiLogs(Array.isArray(hubJson.items) ? hubJson.items : []);
      } catch {
        setHubAiLogs([]);
      }
    } catch (e) {
      setSummary({ totalEvaluations: 0, flaggedRisks: 0, avgTrustScore: null, totalLogs: 0 });
      setEvaluations([]);
      setFraudAlerts([]);
      setPricingSuggestions([]);
      setTrustScores([]);
      setDecisionLogs([]);
      setHubAiLogs([]);
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            LECIPM Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AI Control Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Monitor and control platform AI: evaluations, fraud alerts, pricing suggestions, trust scores, and decision log.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {loading ? "Loading…" : "Refresh all"}
            </button>
            <Link
              href="/admin/ai"
              className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              AI Operating System
            </Link>
            <Link
              href="/admin/ai-monitoring"
              className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              AI Monitoring
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              ← Back to Admin
            </Link>
          </div>
          {error && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{error}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview cards */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Overview</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AiStatCard
              title="Total evaluations"
              value={summary.totalEvaluations}
              subtitle="From AI decision log"
            />
            <AiStatCard
              title="Flagged risks"
              value={summary.flaggedRisks}
              subtitle="Risk score ≥ 40"
              variant={summary.flaggedRisks > 0 ? "warning" : "default"}
            />
            <AiStatCard
              title="Fraud alerts"
              value={fraudAlerts.length}
              subtitle="High-risk scores + open alerts"
              variant={fraudAlerts.length > 0 ? "warning" : "default"}
            />
            <AiStatCard
              title="Avg trust score"
              value={summary.avgTrustScore != null ? summary.avgTrustScore.toFixed(1) : "—"}
              subtitle="From trust_score logs"
              variant="success"
            />
          </div>
        </section>

        {/* Hub AI assistant audit (unified module) */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Hub AI interactions</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Summarized audit of `/api/ai/platform` calls (no raw secrets). Feedback may be attached.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-950/60">
                <tr>
                  <th className="px-3 py-2 font-semibold">UTC</th>
                  <th className="px-3 py-2 font-semibold">Hub</th>
                  <th className="px-3 py-2 font-semibold">Feature</th>
                  <th className="px-3 py-2 font-semibold">Intent</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {hubAiLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-slate-500">
                      No hub AI logs yet.
                    </td>
                  </tr>
                ) : (
                  hubAiLogs.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                        {new Date(row.createdAt).toISOString()}
                      </td>
                      <td className="px-3 py-2">{row.hub}</td>
                      <td className="px-3 py-2">{row.feature}</td>
                      <td className="px-3 py-2">{row.intent}</td>
                      <td className="px-3 py-2">{row.role}</td>
                      <td className="px-3 py-2">{row.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fraud alerts table */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Fraud alerts</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            High-risk listing scores and open property fraud alerts. Re-run check to refresh.
          </p>
          <div className="mt-4">
            <AiFraudAlertsTable alerts={fraudAlerts} onRefresh={load} />
          </div>
        </section>

        {/* Smart pricing suggestions */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Smart pricing suggestions</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Recent AI pricing recommendations by listing. Refresh to recalculate.
          </p>
          <div className="mt-4">
            <AiPricingTable suggestions={pricingSuggestions} onRefresh={load} />
          </div>
        </section>

        {/* Trust score table */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Trust scores</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Recent trust_score log entries (users and listings). Refresh to recompute.
          </p>
          <div className="mt-4">
            <AiTrustTable entries={trustScores} onRefresh={load} />
          </div>
        </section>

        {/* Recent AI decisions log */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recent AI decisions log</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Audit trail of evaluate, fraud_check, price_suggestion, trust_score. Re-run evaluation from here.
          </p>
          <div className="mt-4">
            <AiDecisionLogTable logs={decisionLogs} onRefresh={load} />
          </div>
        </section>
      </div>
    </main>
  );
}
