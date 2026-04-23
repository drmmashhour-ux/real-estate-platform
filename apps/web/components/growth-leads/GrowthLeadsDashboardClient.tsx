"use client";

import { useCallback, useMemo, useState } from "react";

import type { LeadLifecycle, LeadSourceChannel } from "@/modules/growth-leads/leads.types";
import {
  buildLeadDashboardStats,
  captureLead,
  listLeads,
  updateLeadLifecycle,
} from "@/modules/growth-leads/leads-capture.service";

const SOURCES: { id: LeadSourceChannel; label: string }[] = [
  { id: "LISTING_PAGE", label: "Listing page" },
  { id: "BNHUB_BOOKING", label: "BNHub booking" },
  { id: "MARKETING_CONTENT", label: "Marketing content" },
  { id: "LANDING_PAGE", label: "Landing page" },
  { id: "FORM", label: "Form" },
];

export function GrowthLeadsDashboardClient() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  const leads = useMemo(() => listLeads(), [tick]);
  const stats = useMemo(() => buildLeadDashboardStats(leads), [leads]);

  const [demoIntent, setDemoIntent] = useState<"BUYER" | "BROKER" | "INVESTOR" | "RENT">("BUYER");
  const [demoSource, setDemoSource] = useState<LeadSourceChannel>("LANDING_PAGE");

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead routing</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Captures leads from listings, BNHub, marketing CTAs, landings, and forms — scores intent and
          routes each row to brokers, internal sales, investor pipeline, or automated follow-up.
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total leads</p>
          <p className="text-3xl font-semibold">{stats.totalLeads}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">New (lifecycle)</p>
          <p className="text-3xl font-semibold text-amber-200">{stats.newLeads}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Win rate (all)</p>
          <p className="text-3xl font-semibold text-emerald-300">
            {(stats.winRateVsAll * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Conversion (terminal)</p>
          <p className="text-3xl font-semibold text-sky-200">
            {(stats.conversionRate * 100).toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">Among CONVERTED / (CONVERTED + LOST)</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <h2 className="text-lg font-semibold">Source breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SOURCES.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="text-xl font-semibold">{stats.sourceBreakdown[s.id] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-900/40 bg-emerald-950/15 p-5">
        <h2 className="text-lg font-semibold text-emerald-100">Quick capture (demo)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Wire real forms to <code className="text-zinc-400">captureLead()</code> — this block simulates a submission.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            value={demoIntent}
            onChange={(e) => setDemoIntent(e.target.value as typeof demoIntent)}
          >
            <option value="BUYER">Buyer</option>
            <option value="BROKER">Broker</option>
            <option value="INVESTOR">Investor</option>
            <option value="RENT">Rent</option>
          </select>
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            value={demoSource}
            onChange={(e) => setDemoSource(e.target.value as LeadSourceChannel)}
          >
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-500"
            onClick={() => {
              captureLead({
                intent: demoIntent,
                source: demoSource,
                email: `demo-${Date.now()}@example.test`,
                behaviors:
                  demoSource === "LISTING_PAGE"
                    ? { listingViews: 4, clickedCta: true }
                    : { marketingClick: true },
              });
              refresh();
            }}
          >
            Simulate capture
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <h2 className="text-lg font-semibold">Recent leads</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="py-2 pr-2">When</th>
                <th className="py-2 pr-2">Intent</th>
                <th className="py-2 pr-2">Score</th>
                <th className="py-2 pr-2">Source</th>
                <th className="py-2 pr-2">Route</th>
                <th className="py-2 pr-2">Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-600">
                    No leads stored yet — use Quick capture or connect a form.
                  </td>
                </tr>
              ) : (
                leads.slice(0, 40).map((l) => (
                  <tr key={l.id} className="border-b border-white/5">
                    <td className="py-2 pr-2 text-zinc-400">
                      {new Date(l.capturedAtIso).toLocaleString()}
                    </td>
                    <td className="py-2 pr-2">{l.intent}</td>
                    <td className="py-2 pr-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{l.intentLevel}</span>
                    </td>
                    <td className="py-2 pr-2 text-zinc-400">{l.source}</td>
                    <td className="py-2 pr-2">
                      <span className="text-emerald-300">{l.route.target}</span>
                      {l.route.brokerTier ? (
                        <span className="text-zinc-500"> · {l.route.brokerTier}</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className="rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                        value={l.lifecycle}
                        onChange={(e) => {
                          updateLeadLifecycle(l.id, e.target.value as LeadLifecycle);
                          refresh();
                        }}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
