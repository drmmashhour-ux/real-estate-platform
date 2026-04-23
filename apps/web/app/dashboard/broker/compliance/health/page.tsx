"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ScoreRow = {
  id: string;
  score: number;
  grade: string;
  riskLevel: string;
  lastComputedAt: string;
  factors: Record<string, unknown>;
  scopeType: string;
  scopeId: string | null;
};

type RiskEvt = {
  id: string;
  riskType: string;
  severity: string;
  description: string;
  detectedBy: string;
  requiresReview: boolean;
  reviewed: boolean;
  createdAt: string;
};

type AnomalyRow = {
  id: string;
  anomalyType: string;
  description: string;
  severity: string;
  baselineValue: number | null;
  detectedValue: number | null;
  detectedAt: string;
};

export default function ComplianceHealthDashboard() {
  const [latestScore, setLatestScore] = useState<ScoreRow | null>(null);
  const [riskEvents, setRiskEvents] = useState<RiskEvt[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>([]);
  const [flags, setFlags] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/health", { credentials: "same-origin" });
      const data = (await res.json()) as {
        success?: boolean;
        latestScore?: ScoreRow | null;
        riskEvents?: RiskEvt[];
        anomalies?: AnomalyRow[];
        error?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to load compliance health");
        return;
      }
      setLatestScore(data.latestScore ?? null);
      setRiskEvents(data.riskEvents ?? []);
      setAnomalies(data.anomalies ?? []);
      const f = data.latestScore?.factors as { flags?: Record<string, unknown> } | undefined;
      setFlags((f?.flags as Record<string, unknown>) ?? null);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function recompute() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/score/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ scopeType: "global" }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; flags?: Record<string, unknown> };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Recompute failed");
        return;
      }
      setFlags(data.flags ?? null);
      await load();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Compliance health</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Explainable score from operational signals (complaints, trust stress, anomalies). Flags are advisory only —
            they do not auto-sanction. Critical scores suggest prioritizing human review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void recompute()}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-50"
          >
            Recompute score
          </button>
          <Link
            href="/dashboard/broker/compliance/review-queue"
            className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Review queue
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="rounded-xl border border-white/15 bg-black/50 p-5">
        {latestScore ? (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">Score</p>
                <p className="text-3xl font-bold tabular-nums text-white">
                  {latestScore.score.toFixed(0)}
                  <span className="ml-2 text-xl text-[#D4AF37]">({latestScore.grade})</span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">Risk level</p>
                <p className="text-lg font-medium capitalize text-white">{latestScore.riskLevel}</p>
              </div>
              <div className="text-xs text-white/40">
                Last run: {new Date(latestScore.lastComputedAt).toLocaleString("en-CA")}
              </div>
            </div>
            {flags ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
                <span className="font-medium">Advisory flags: </span>
                {flags.requireManualReview ? "Manual review suggested (critical band). " : null}
                {flags.triggerAuditFlag ? "Complaint velocity spike vs prior period — audit trail review suggested." : null}
                {!flags.requireManualReview && !flags.triggerAuditFlag ? "None active from last compute." : null}
              </div>
            ) : null}
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-white/70">
              {JSON.stringify(latestScore.factors, null, 2)}
            </pre>
          </>
        ) : (
          <p className="text-sm text-white/50">
            No score yet. Use &quot;Recompute score&quot; to run the engine (signals must exist in the database).
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/15 bg-black/50 p-5">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Risk alerts</h2>
          <p className="mt-1 text-xs text-white/45">Rule-engine and recorded events — not automatic enforcement.</p>
          <ul className="mt-4 space-y-3 text-sm">
            {riskEvents.length === 0 ? (
              <li className="text-white/45">No risk events for this scope.</li>
            ) : (
              riskEvents.map((e) => (
                <li key={e.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium text-white">{e.riskType}</span>
                    <span className="text-xs uppercase text-[#D4AF37]">{e.severity}</span>
                  </div>
                  <p className="mt-1 text-white/65">{e.description}</p>
                  <p className="mt-1 text-xs text-white/35">
                    {e.detectedBy} · {new Date(e.createdAt).toLocaleString("en-CA")}
                    {e.requiresReview && !e.reviewed ? " · review pending" : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/50 p-5">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Anomalies</h2>
          <p className="mt-1 text-xs text-white/45">Traceable deviations (e.g. complaint spike vs baseline window).</p>
          <ul className="mt-4 space-y-3 text-sm">
            {anomalies.length === 0 ? (
              <li className="text-white/45">No anomaly records yet.</li>
            ) : (
              anomalies.map((a) => (
                <li key={a.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium text-white">{a.anomalyType}</span>
                    <span className="text-xs uppercase text-orange-300">{a.severity}</span>
                  </div>
                  <p className="mt-1 text-white/65">{a.description}</p>
                  <p className="mt-1 text-xs text-white/35">
                    baseline {a.baselineValue ?? "—"} → detected {a.detectedValue ?? "—"} ·{" "}
                    {new Date(a.detectedAt).toLocaleString("en-CA")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
