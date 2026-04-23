"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  buildSalesManagerSummary,
  buildTeamPerformanceSummary,
  buildTopImprovementOpportunities,
  computeOverallSalesScore,
  refreshUserIntelligence,
} from "@/modules/ai-sales-manager/ai-sales-manager.service";
import { listRecentAlerts } from "@/modules/ai-sales-manager/ai-sales-alerts.service";
import { listSalesProfiles } from "@/modules/ai-sales-manager/ai-sales-profile.service";
import { listTeams } from "@/modules/team-training/team.service";

export function AiSalesManagerDashboardClient({
  adminBase,
}: {
  adminBase: string;
}) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  void tick;
  const summary = buildSalesManagerSummary();
  const profiles = listSalesProfiles();
  const alerts = listRecentAlerts(35);
  const teams = listTeams();

  const [teamId, setTeamId] = useState("");
  const teamRollup = teamId ? buildTeamPerformanceSummary(teamId) : null;
  const opportunities = teamId ? buildTopImprovementOpportunities(teamId) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">LECIPM · Management intelligence</p>
        <h1 className="text-2xl font-semibold tracking-tight">AI Sales Manager</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Coaching layer across training, live assistant, psychology, negotiation, team training, and call replay.{" "}
          <strong className="font-medium text-zinc-200">
            Humans approve every action — no auto-calling or auto-speaking to buyers.
          </strong>
        </p>
      </header>

      <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 p-4 text-sm text-emerald-100/90">
        <p className="font-medium text-emerald-200">Governance</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Recommendations are rule-based / explainable — managers can override.</li>
          <li>Forecast confidence stays conservative when samples are thin.</li>
          <li>Outbound voice is never automated here.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Team overview</h2>
          <button
            type="button"
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={() => refresh()}
          >
            Refresh snapshot
          </button>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Tracked reps" value={String(summary.totalUsers)} hint="profiles in workspace" />
          <Metric label="Logged calls (sum)" value={String(summary.aggregate.totalCalls)} hint="CRM-style logs" />
          <Metric label="Demos booked" value={String(summary.aggregate.demosBooked)} hint="aggregate" />
          <Metric label="Avg training score" value={`${summary.aggregate.avgTrainingScore}`} hint="lab blended" />
          <Metric label="Avg control score" value={`${summary.aggregate.avgControlScore}`} hint="calls + lab" />
          <Metric label="Avg closing score" value={`${summary.aggregate.avgClosingScore}`} hint="lab heuristic" />
          <Metric label="Demo rate (agg.)" value={`${Math.round(summary.aggregate.demoRate * 100)}%`} hint="demos ÷ calls" />
          <Metric label="Win rate (tracked)" value={`${Math.round(summary.aggregate.closeRate * 100)}%`} hint="wins ÷ closes" />
        </dl>
        <p className="mt-4 text-sm text-zinc-500">{summary.trendSummary}</p>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Salesperson cards</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {profiles.length === 0 ?
            <p className="text-sm text-zinc-500">No profiles yet — log training sessions or call outcomes to populate.</p>
          : profiles.map((p) => {
              const sc = computeOverallSalesScore(p);
              const href = `${adminBase}/ai-sales-manager/${encodeURIComponent(p.userId)}`;
              return (
                <div
                  key={p.userId}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-amber-700/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={href} className="font-medium text-amber-300 hover:text-amber-200">
                        {p.displayName ?? p.userId.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-zinc-500">Trend: {p.improvementTrend}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-sm font-semibold text-amber-300">
                      {sc.overall}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Strength signal: training {Math.round(p.averageTrainingScore)} · control {Math.round(p.averageControlScore)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
                      onClick={() => {
                        refreshUserIntelligence(p.userId);
                        refresh();
                      }}
                    >
                      Recompute intel
                    </button>
                  </div>
                </div>
              );
            })
          }
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Team drill-down</h2>
        <label className="mt-3 block text-sm text-zinc-400">
          Team (from Team training)
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Select team…</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {teamRollup ?
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-zinc-400">
              <span className="text-zinc-200">{teamRollup.teamName}</span> · {teamRollup.memberCount} members
            </p>
            <p className="text-zinc-500">Common objections: {teamRollup.commonObjections.map((o) => o.label.slice(0, 32)).join(" · ") || "—"}</p>
            <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
              {teamRollup.members.map((m) => (
                <li key={m.memberId} className="flex justify-between gap-2 px-3 py-2">
                  <Link className="text-amber-400 hover:text-amber-300" href={`${adminBase}/ai-sales-manager/${encodeURIComponent(m.memberId)}`}>
                    {m.displayName}
                  </Link>
                  <span className="text-zinc-400">
                    {m.overallScore} · {m.trend}
                  </span>
                </li>
              ))}
            </ul>
            <div>
              <p className="font-medium text-zinc-300">Improvement queue</p>
              <ul className="mt-2 space-y-2 text-xs text-zinc-400">
                {opportunities.slice(0, 6).map((o) => (
                  <li key={o.memberId}>
                    <span className="text-zinc-200">{o.displayName}</span> — {o.summary}{" "}
                    <span className="text-zinc-600">priority {Math.round(o.priority)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        : <p className="mt-3 text-sm text-zinc-500">Pick a team to compare members and objections.</p>}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Coaching priorities (org-level)</h2>
        <ul className="mt-3 list-inside list-disc text-sm text-zinc-400">
          {summary.coachingOpportunities.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Forecasts</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Probabilistic bands per rep — open a salesperson card for demo/close uplift narratives and risk factors.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Alerts</h2>
        <ul className="mt-4 space-y-3">
          {alerts.length === 0 ?
            <li className="text-sm text-zinc-500">No alerts yet — profiles need activity + refresh.</li>
          : alerts.map((a) => (
              <li key={a.alertId} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm">
                <span className={`text-xs uppercase ${a.severity === "warn" ? "text-rose-400" : a.severity === "positive" ? "text-emerald-400" : "text-zinc-500"}`}>
                  {a.kind.replace(/_/g, " ")}
                </span>
                <p className="font-medium text-zinc-200">{a.title}</p>
                <p className="text-zinc-400">{a.body}</p>
                <Link className="mt-1 inline-block text-xs text-amber-400" href={`${adminBase}/ai-sales-manager/${encodeURIComponent(a.userId)}`}>
                  View rep →
                </Link>
              </li>
            ))
          }
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-medium">Top performers · needs support</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-zinc-500">Top</p>
            <ul className="mt-2 space-y-2 text-sm">
              {summary.topPerformers.map((x) => (
                <li key={x.userId}>
                  <Link className="text-amber-400 hover:text-amber-300" href={`${adminBase}/ai-sales-manager/${encodeURIComponent(x.userId)}`}>
                    {x.displayName ?? x.userId.slice(0, 10)}
                  </Link>{" "}
                  <span className="text-zinc-500">{x.overallScore}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Needs support</p>
            <ul className="mt-2 space-y-2 text-sm">
              {summary.needsSupport.map((x) => (
                <li key={x.userId}>
                  <Link className="text-rose-300 hover:text-rose-200" href={`${adminBase}/ai-sales-manager/${encodeURIComponent(x.userId)}`}>
                    {x.displayName ?? x.userId.slice(0, 10)}
                  </Link>{" "}
                  <span className="text-zinc-500">{x.reasons.join("; ") || "low composite"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
      <p className="text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}
