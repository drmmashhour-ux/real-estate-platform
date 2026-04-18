"use client";

import * as React from "react";
import type { GrowthDailyBrief } from "@/modules/growth/growth-daily-brief.types";

function statusBadge(s: GrowthDailyBrief["status"]): string {
  if (s === "strong") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-100";
  if (s === "healthy") return "border-sky-500/45 bg-sky-950/30 text-sky-100";
  if (s === "watch") return "border-amber-500/50 bg-amber-950/35 text-amber-100";
  return "border-rose-500/45 bg-rose-950/35 text-rose-100";
}

export function GrowthDailyBriefPanel() {
  const [brief, setBrief] = React.useState<GrowthDailyBrief | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/daily-brief", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Daily brief load failed");
        return j as { brief: GrowthDailyBrief };
      })
      .then((j) => {
        if (!cancelled) setBrief(j.brief);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!brief) return <p className="text-sm text-zinc-500">Loading daily brief…</p>;

  const prios = brief.today.priorities.slice(0, 3);

  return (
    <div className="rounded-xl border border-teal-900/45 bg-teal-950/20 p-4">
      <h3 className="text-sm font-semibold text-teal-100">🗓 Daily Growth Brief</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Read-only recap (UTC windows) — priorities reuse the executive engine. No automated actions.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge(brief.status)}`}
        >
          {brief.status}
        </span>
        <span className="text-[11px] text-zinc-600">Date: {brief.date}</span>
      </div>

      <div className="mt-4 grid gap-3 border-t border-teal-900/35 pt-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Yesterday (early conversion · UTC)</p>
          <p className="mt-1 text-xs text-zinc-400">
            Leads: <strong className="text-zinc-200">{brief.yesterday.leads}</strong>
            {" · "}
            UTM campaigns (active): <strong className="text-zinc-200">{brief.yesterday.campaignsActive}</strong>
          </p>
          {brief.yesterday.topCampaign ? (
            <p className="mt-1 text-xs text-teal-200/90">
              Top campaign: <strong className="text-white">{brief.yesterday.topCampaign}</strong>
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">Top campaign: —</p>
          )}
          {brief.yesterday.conversionsStarted != null ? (
            <p className="mt-1 text-[11px] text-zinc-500">
              Conversion starts flagged: {brief.yesterday.conversionsStarted}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Today focus</p>
          {brief.today.focus ? (
            <p className="mt-1 text-sm text-teal-100">
              🎯 <span className="font-medium text-white">{brief.today.focus}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">🎯 — (see priorities)</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Priorities (top 3)</p>
        <ul className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-300">
          {prios.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      {brief.blockers.length > 0 ? (
        <div className="mt-4 border-t border-teal-900/35 pt-3">
          <p className="text-[11px] font-semibold uppercase text-amber-500/90">Blockers / attention</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
            {brief.blockers.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-amber-500/80">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 border-t border-teal-900/35 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Notes</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-500">
          {brief.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
