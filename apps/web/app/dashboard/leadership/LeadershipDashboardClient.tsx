"use client";

import Link from "next/link";

import type { LeadershipEvaluation } from "@/modules/strategy/market-leadership.engine";
import type { LeadershipMetrics } from "@/modules/strategy/leadership-metrics.types";
import { buildUsageMetricLines, EXAMPLE_TESTIMONIALS } from "@/modules/strategy/social-proof";
import { BROKER_DOMINATION_LOOP } from "@/modules/strategy/broker-domination.loop";
import { buildVisibilityPlan } from "@/modules/growth/visibility.engine";
import { LECIPM_CATEGORY, LECIPM_CATEGORY_SHORT } from "@/modules/strategy/category";
import { PRIMARY_MARKET } from "@/modules/strategy/primary-market.config";

type Props = {
  metrics: LeadershipMetrics;
  evaluation: LeadershipEvaluation;
  scope: "montreal" | "quebec";
};

export function LeadershipDashboardClient({ metrics, evaluation, scope }: Props) {

  const lines = buildUsageMetricLines(metrics);
  const vis = buildVisibilityPlan();
  const penetrationPct = Math.min(100, Math.round((metrics.activeBrokers / 200) * 100));
  const growthNarrative =
    evaluation.leadershipScore >= 60
      ? "Trajectory positive vs. internal baseline — keep tightening broker depth in Montréal before Québec-wide marketing spend."
      : "Focus segment execution: broker acquisition, deal throughput, and engagement before broad visibility pushes.";

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 text-zinc-100">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/90">Strategy · no comparative rank claims</p>
        <h1 className="text-2xl font-semibold">Market leadership</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Category: {LECIPM_CATEGORY}. Short: {LECIPM_CATEGORY_SHORT}. Strength is measured here — not with unverified
          &quot;#1&quot; language.
        </p>
        <p className="mt-1 text-xs text-zinc-500">Primary market: {PRIMARY_MARKET.primaryLabel} → then {PRIMARY_MARKET.nextRegionLabel}.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="text-zinc-500">Scope:</span>
          <Link
            href="/dashboard/leadership"
            scroll={false}
            className={`rounded-lg px-2 py-1 ${scope === "montreal" ? "bg-amber-500/20 text-amber-200" : "bg-zinc-800 text-zinc-400"}`}
          >
            Montréal (primary)
          </Link>
          <Link
            href="/dashboard/leadership?scope=quebec"
            scroll={false}
            className={`rounded-lg px-2 py-1 ${scope === "quebec" ? "bg-amber-500/20 text-amber-200" : "bg-zinc-800 text-zinc-400"}`}
          >
            Québec (rollup)
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-[10px] uppercase text-amber-200/80">Leadership score</p>
          <p className="mt-1 font-mono text-3xl text-amber-100">{evaluation.leadershipScore}</p>
          <p className="mt-1 text-xs text-zinc-500">Composite 0–100 (internal model)</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
          <p className="text-[10px] uppercase text-zinc-500">Primary penetration proxy</p>
          <p className="mt-1 font-mono text-2xl text-cyan-200/90">{penetrationPct}%</p>
          <p className="text-xs text-zinc-500">of internal broker aspiration (n={metrics.activeBrokers})</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
          <p className="text-[10px] uppercase text-zinc-500">Growth narrative</p>
          <p className="mt-1 text-sm text-zinc-300">{growthNarrative}</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Measured inputs</h2>
        <p className="text-xs text-zinc-500">Data scope: {metrics.scope}</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span className="text-zinc-400">{l.label}</span>
              <span className="font-mono text-zinc-100">{l.value}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-zinc-600">as of {new Date(metrics.asOfIso).toLocaleString()}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Gaps (prioritized)</h2>
        <ul className="mt-2 space-y-2">
          {evaluation.gaps.map((g) => (
            <li
              key={g.id}
              className={`rounded-xl border px-3 py-2 text-sm ${
                g.severity === "high"
                  ? "border-rose-800/50 bg-rose-950/20"
                  : g.severity === "medium"
                    ? "border-amber-800/40 bg-amber-950/15"
                    : "border-white/10 bg-zinc-900/30"
              }`}
            >
              <span className="text-[10px] uppercase text-zinc-500">{g.severity}</span>
              <p className="text-zinc-300">{g.message}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Component weights (internal)</h2>
        <div className="mt-2 grid gap-2 font-mono text-xs text-zinc-400 sm:grid-cols-2">
          <p>Brokers: {Math.round(evaluation.components.activeBrokers)}</p>
          <p>Deals: {Math.round(evaluation.components.dealsProcessed)}</p>
          <p>Engagement: {Math.round(evaluation.components.engagementRate)}</p>
          <p>Revenue: {Math.round(evaluation.components.revenue)}</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Visibility plan</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {vis.filter((v) => v.primaryMarket).map((v) => (
            <li key={v.id} className="rounded-lg border border-white/10 bg-zinc-900/30 p-3">
              <span className="text-[10px] uppercase text-cyan-500/80">{v.channel}</span>
              <p className="font-medium text-zinc-200">{v.title}</p>
              <p className="text-xs text-zinc-500">{v.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Broker domination loop</h2>
        <div className="mt-2 space-y-4">
          {BROKER_DOMINATION_LOOP.map((b) => (
            <div key={b.stage} className="rounded-xl border border-white/10 p-3">
              <p className="text-[10px] uppercase text-zinc-500">{b.stage}</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-zinc-300">
                {b.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Social proof (qualitative + measured)</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {EXAMPLE_TESTIMONIALS.map((t) => (
            <blockquote key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
              “{t.quote}”
              <footer className="mt-2 text-xs text-zinc-500">
                — {t.role}, {t.marketLabel}
              </footer>
            </blockquote>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-600">Replace placeheld quotes with CMS-backed, consented testimonials.</p>
      </section>

      <p className="text-center text-xs text-zinc-600">
        <Link href="/dashboard/global" className="text-amber-400/90 hover:underline">
          Global markets
        </Link>
        {" · "}
        <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
          Command center
        </Link>
      </p>
    </div>
  );
}
