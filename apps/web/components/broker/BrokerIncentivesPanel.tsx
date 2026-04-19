"use client";

import * as React from "react";
import type { BrokerIncentiveSummary } from "@/modules/broker/incentives/broker-incentives.types";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-200">
      {children}
    </span>
  );
}

export function BrokerIncentivesPanel({ accent = "#34d399" }: { accent?: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<BrokerIncentiveSummary | null>(null);
  const [disclaimer, setDisclaimer] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/broker/incentives", { credentials: "same-origin" });
        if (res.status === 404) {
          if (!cancelled) setErr("Incentives are not enabled.");
          return;
        }
        const data = (await res.json()) as {
          summary?: BrokerIncentiveSummary;
          disclaimer?: string;
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setErr(data.error ?? "Failed to load");
          return;
        }
        if (!cancelled) {
          setSummary(data.summary ?? null);
          setDisclaimer(data.disclaimer ?? null);
        }
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Loading recognition…</p>
      </section>
    );
  }
  if (err || !summary) {
    return err ? (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">{err}</section>
    ) : null;
  }

  const achievedMs = summary.milestones.filter((m) => m.achieved);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recognition</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Progress & milestones</h2>
          <p className="mt-1 max-w-xl text-xs text-slate-500">{disclaimer}</p>
        </div>
      </div>

      {summary.highlights.length > 0 ? (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">Highlights</p>
          <ul className="mt-2 space-y-1.5 text-sm text-emerald-50/95">
            {summary.highlights.map((h, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: accent }}>✓</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Active streaks (UTC days)</p>
          <ul className="mt-2 space-y-2">
            {summary.streaks.map((s) => (
              <li
                key={s.type}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs"
              >
                <span className="capitalize text-slate-300">{s.type}</span>
                <span className="tabular-nums text-white">
                  {s.currentCount} current · best {s.bestCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Badges earned</p>
          {summary.badges.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">Keep going — badges unlock from real CRM signals.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {summary.badges.map((b) => (
                <li key={b.id}>
                  <Pill>
                    <span style={{ color: accent }} className="mr-1">
                      ●
                    </span>
                    {b.label}
                    {b.level ? ` · ${b.level}` : ""}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Milestones</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {summary.milestones.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg border px-3 py-2 text-xs ${
                m.achieved ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-50" : "border-white/10 bg-black/20 text-slate-500"
              }`}
            >
              <span className="font-medium">{m.label}</span>
              {m.achieved ? <span className="ml-2 text-[10px] text-emerald-300/80">Done</span> : null}
            </li>
          ))}
        </ul>
      </div>

      {summary.nextTargets.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Suggested next focus</p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
            {summary.nextTargets.map((t, i) => (
              <li key={i}>→ {t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-3 text-[10px] text-slate-600">
        {achievedMs.length} milestone{achievedMs.length === 1 ? "" : "s"} achieved in this workspace sample.
      </p>
    </section>
  );
}
