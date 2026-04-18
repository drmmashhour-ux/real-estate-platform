"use client";

import * as React from "react";
import type { LeadRoutingSummary } from "@/modules/broker/routing/broker-routing.types";

function bandClass(b: string): string {
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "good") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "watch") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-rose-500/15 text-rose-100 border-rose-500/40";
}

function qualityBand(score: number): string {
  if (score >= 70) return "Higher signal (score)";
  if (score >= 45) return "Medium signal (score)";
  return "Lower signal (score)";
}

export function LeadRoutingPanel({
  leadId,
  leadIntent,
  leadCity,
  leadScore,
}: {
  leadId: string;
  leadIntent?: string;
  leadCity?: string;
  leadScore?: number;
}) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<LeadRoutingSummary | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/routing`, {
          credentials: "same-origin",
        });
        if (res.status === 404) {
          if (!cancelled) setErr("Routing is not enabled or unavailable.");
          return;
        }
        const j = (await res.json()) as { summary?: LeadRoutingSummary; error?: string };
        if (!res.ok) {
          if (!cancelled) setErr(j.error ?? "Failed to load routing");
          return;
        }
        if (!cancelled) setData(j.summary ?? null);
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (loading) {
    return (
      <section className="mb-8 rounded-xl border border-violet-500/25 bg-violet-950/20 p-4 text-sm text-slate-400">
        Loading smart routing…
      </section>
    );
  }
  if (err || !data) {
    return err ? (
      <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">{err}</section>
    ) : null;
  }

  const intent = leadIntent ?? "—";
  const city = leadCity ?? "—";
  const qb = typeof leadScore === "number" ? qualityBand(leadScore) : "—";

  return (
    <section className="mb-8 rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(139,92,246,0.12),rgba(11,11,11,0.92))] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">Internal</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Smart Lead Routing</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Advisory candidate ranking only — does not assign brokers. Not shown to brokers in V1.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-black/25 p-3 text-xs sm:grid-cols-3">
        <div>
          <span className="text-slate-500">Intent (model)</span>
          <p className="font-medium text-slate-200">{intent}</p>
        </div>
        <div>
          <span className="text-slate-500">Region / city</span>
          <p className="font-medium text-slate-200">{city}</p>
        </div>
        <div>
          <span className="text-slate-500">Lead score band</span>
          <p className="font-medium text-slate-200">{qb}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top candidates</p>
        {data.topCandidates.length === 0 ? (
          <p className="text-sm text-slate-500">No candidates computed.</p>
        ) : (
          <ul className="space-y-3">
            {data.topCandidates.map((c, i) => (
              <li
                key={c.brokerId}
                className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-white">
                    {i + 1}. {c.brokerName ?? c.brokerId.slice(0, 8) + "…"}
                  </span>
                  <span className="tabular-nums text-slate-200">Score {c.rankScore}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${bandClass(c.fitBand)}`}
                  >
                    {c.fitBand}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] text-slate-500">
                  <span>R {c.breakdown.regionFitScore}</span>
                  <span>I {c.breakdown.intentFitScore}</span>
                  <span>P {c.breakdown.performanceFitScore}</span>
                  <span>Rsp {c.breakdown.responseFitScore}</span>
                  <span>Cap {c.breakdown.availabilityFitScore}</span>
                </div>
                <ul className="mt-2 list-inside list-disc text-[11px] text-slate-400">
                  {c.why.map((w, i) => (
                    <li key={`${c.brokerId}-why-${i}`}>{w}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.routingNotes.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-amber-200/90">Routing notes</p>
          <ul className="mt-1 list-inside list-disc text-[11px] text-slate-500">
            {data.routingNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
