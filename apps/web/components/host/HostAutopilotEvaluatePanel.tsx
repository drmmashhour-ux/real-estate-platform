"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { AutopilotEvaluationResult } from "@/modules/host-ai";

function riskBadge(risk: string) {
  if (risk === "high") return "bg-red-500/15 text-red-200 border-red-500/35";
  if (risk === "medium") return "bg-amber-500/15 text-amber-200 border-amber-500/35";
  return "bg-emerald-500/10 text-emerald-200 border-emerald-500/30";
}

export function HostAutopilotEvaluatePanel({ className = "" }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const [evaluation, setEvaluation] = useState<AutopilotEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setRateLimited(false);
    startTransition(async () => {
      const res = await fetch("/api/ai/host-autopilot/evaluate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setRateLimited(true);
        setEvaluation(null);
        return;
      }
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Could not load evaluation");
        setEvaluation(null);
        return;
      }
      setEvaluation((data as { evaluation: AutopilotEvaluationResult }).evaluation ?? null);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className={`rounded-2xl border border-amber-500/25 bg-amber-950/10 p-5 text-slate-200 ${className}`}
      aria-label="AI Autopilot suggestions"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Autopilot</h2>
          <p className="mt-1 text-sm text-slate-500">
            Transparent suggestions only — bookings and money always need you.{" "}
            <Link href="/dashboard/host/autopilot" className="text-amber-400 hover:text-amber-300">
              Open full console
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => load()}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/15 disabled:opacity-40"
        >
          {pending ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {rateLimited ? (
        <p className="mt-3 text-sm text-amber-200/90">
          Too many refreshes — wait a bit or use the full autopilot page. Fallback: handle tasks manually.
        </p>
      ) : null}

      {evaluation ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-300">{evaluation.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full border px-2 py-0.5 ${riskBadge(evaluation.riskLevel)}`}>
              Risk: {evaluation.riskLevel}
            </span>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-slate-400">
              Confidence (avg): {Math.round(evaluation.overallConfidence * 100)}%
            </span>
          </div>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
            {evaluation.actions.length === 0 ? (
              <li className="text-slate-500">No actions queued in this snapshot.</li>
            ) : (
              evaluation.actions.map((a) => (
                <li key={a.id} className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                  <p className="font-medium text-amber-100/90">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{a.explanation}</p>
                  <p className="mt-2 text-[11px] text-slate-600">
                    Next step: {a.executionHint.replace(/_/g, " ")} · model confidence ~{Math.round(a.confidence * 100)}%
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
