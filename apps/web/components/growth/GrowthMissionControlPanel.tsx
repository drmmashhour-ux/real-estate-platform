"use client";

import * as React from "react";
import Link from "next/link";
import type { GrowthMissionControlSummary } from "@/modules/growth/growth-mission-control.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { applyPolicyToMissionControlPromotion } from "@/modules/growth/growth-policy-enforcement-bridge.service";
import { GrowthGovernancePolicyDomainBadge } from "./GrowthGovernancePolicyDomainBadge";

function statusBadge(status: GrowthMissionControlSummary["status"]): string {
  if (status === "strong") return "border-emerald-500/50 bg-emerald-950/35 text-emerald-100";
  if (status === "healthy") return "border-sky-500/45 bg-sky-950/30 text-sky-100";
  if (status === "watch") return "border-amber-500/45 bg-amber-950/35 text-amber-100";
  return "border-rose-500/45 bg-rose-950/35 text-rose-100";
}

function sevClass(s: "low" | "medium" | "high"): string {
  if (s === "high") return "text-rose-300";
  if (s === "medium") return "text-amber-200";
  return "text-zinc-400";
}

export function GrowthMissionControlPanel({
  locale,
  country,
  policyBadgeEnabled,
  enforcementSnapshot,
}: {
  locale: string;
  country: string;
  /** Display-only policy domain badge when governance policy console flags are on. */
  policyBadgeEnabled?: boolean;
  /** When set, may suppress promotion affordances (advisory-only display). */
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
}) {
  const base = `/${locale}/${country}/dashboard/growth`;
  const [summary, setSummary] = React.useState<GrowthMissionControlSummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/mission-control", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; summary?: GrowthMissionControlSummary };
        if (!r.ok) throw new Error(j.error ?? "Mission control unavailable");
        return j.summary ?? null;
      })
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading mission control…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!summary) {
    return null;
  }

  const promoGate = applyPolicyToMissionControlPromotion(enforcementSnapshot ?? null);

  return (
    <section
      className="rounded-xl border border-violet-900/50 bg-violet-950/20 p-4"
      aria-label="Growth mission control"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-violet-100">🎛 Growth Mission Control</h3>
          <GrowthGovernancePolicyDomainBadge domain="fusion" enabled={policyBadgeEnabled} />
          <GrowthGovernancePolicyDomainBadge domain="messaging" enabled={policyBadgeEnabled} />
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadge(summary.status)}`}
        >
          {summary.status}
        </span>
      </div>

      {promoGate.suppressPromotion && promoGate.note ? (
        <p className="mt-2 rounded border border-amber-500/35 bg-amber-950/25 px-2 py-1.5 text-[11px] text-amber-100/95">
          {promoGate.note}
        </p>
      ) : null}

      {summary.missionFocus ? (
        <div className="mt-3 rounded-lg border border-violet-500/35 bg-violet-950/30 p-3 shadow-sm shadow-violet-950/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-300/90">Mission focus</p>
          <p className="mt-1.5 text-base font-semibold leading-snug text-white">{summary.missionFocus.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-300/95">{summary.missionFocus.why}</p>
          <span className="mt-2 inline-block rounded bg-zinc-900/90 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            {summary.missionFocus.source.replace(/_/g, " ")}
          </span>
        </div>
      ) : null}

      {summary.todayChecklist.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Today</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-200">
            {summary.todayChecklist.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.topRisks.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Top risks</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {summary.topRisks.map((r) => (
              <li key={`${r.source}-${r.title}`} className="text-zinc-300">
                <span className={sevClass(r.severity)}>[{r.severity}]</span> {r.title}{" "}
                <span className="text-zinc-500">({r.source})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
        {summary.strategyFocus ? (
          <div>
            <span className="font-semibold text-zinc-500">Strategy</span>
            <p className="text-zinc-300">{summary.strategyFocus}</p>
          </div>
        ) : null}
        {summary.simulationRecommendation ? (
          <div>
            <span className="font-semibold text-zinc-500">Simulation (advisory)</span>
            <p className="text-zinc-300">{summary.simulationRecommendation}</p>
          </div>
        ) : null}
      </div>

      {summary.humanReviewQueue.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Human review</p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
            {summary.humanReviewQueue.slice(0, 5).map((item) => (
              <li key={item.id}>
                <span className={sevClass(item.severity)}>[{item.severity}]</span> {item.title}
                <span className="text-zinc-500"> — {item.source}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(summary.frozenDomains.length > 0 || summary.blockedDomains.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.frozenDomains.map((d) => (
            <span
              key={`f-${d}`}
              className="rounded-full border border-amber-800/60 bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber-100"
            >
              Frozen: {d}
            </span>
          ))}
          {summary.blockedDomains.map((d) => (
            <span
              key={`b-${d}`}
              className="rounded-full border border-rose-900/50 bg-rose-950/30 px-2 py-0.5 text-[11px] text-rose-100"
            >
              Blocked: {d}
            </span>
          ))}
        </div>
      )}

      {summary.notes.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {summary.notes.slice(0, 6).map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-[11px] text-zinc-500">
        Related sections on this page: Fusion, Executive, Daily Brief, Governance, Strategy, Multi-agent, Simulations,
        Response Desk (when enabled).{" "}
        <Link href={base} className="text-violet-400 hover:underline">
          Growth hub
        </Link>
      </p>
      <p className="mt-2 text-[10px] text-zinc-600">
        Advisory only — no auto-execution. Source panels remain authoritative.
      </p>
    </section>
  );
}
