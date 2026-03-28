"use client";

import { useEffect, useState } from "react";
import { DemoEvents } from "@/lib/demo-event-types";

type AnalyticsPayload = {
  ok?: boolean;
  windowDays?: number;
  totals?: { users: number; events: number; sessionStarts: number };
  blockedCount?: number;
  byEvent?: { event: string; count: number }[];
  last24h?: { id: string; event: string; metadata: unknown; userId: string | null; createdAt: string }[];
  message?: string;
  topListingViews?: { listingId: string; count: number }[];
  topSearchQueries?: { query: string; count: number }[];
  topBlockedRoutes?: { route: string; count: number }[];
  funnel?: { view_listing: number; contact_broker: number; create_offer: number };
  guidedDemo?: {
    startedUsers: number;
    completedUsers: number;
    completionRatePct: number;
    dropOffStep: string | null;
    stepCounts: { stepId: string; count: number }[];
  };
  dealAnalyzer?: {
    runs: number;
    completions: number;
    avgScore: number | null;
    topListings: { listingId: string; count: number }[];
  };
  mortgageSimulator?: {
    used: number;
    scenarioAdded: number;
    scenarioCompared: number;
  };
};

export function AdminDemoAnalyticsClient() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/demo/analytics")
      .then((r) => r.json())
      .then((j: AnalyticsPayload) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {
        if (!cancelled) setErr("Could not load analytics");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-xs text-red-400">{err}</p>;
  if (!data?.ok) {
    return <p className="text-xs text-slate-500">{data?.message ?? "Loading…"}</p>;
  }

  const windowLabel = data.windowDays != null ? `${data.windowDays}d` : "7d";
  const topPages = (data.last24h ?? [])
    .filter((e) => e.event === DemoEvents.PAGE_VIEW)
    .slice(0, 12);

  const funnel = data.funnel ?? { view_listing: 0, contact_broker: 0, create_offer: 0 };
  const gd = data.guidedDemo;
  const da = data.dealAnalyzer;
  const ms = data.mortgageSimulator;

  return (
    <div className="space-y-6 text-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-slate-500">Users (DB)</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data.totals?.users ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-slate-500">Demo events (total)</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data.totals?.events ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-slate-500">Session starts (tracked)</p>
          <p className="mt-1 text-2xl font-semibold text-white">{data.totals?.sessionStarts ?? 0}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Conversion funnel ({windowLabel})</p>
        <p className="mt-1 text-xs text-slate-500">
          {DemoEvents.VIEW_LISTING} → {DemoEvents.CONTACT_BROKER} → {DemoEvents.CREATE_OFFER}
        </p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
          <li className="flex justify-between border-b border-white/5 px-3 py-2">
            <span className="text-slate-300">Listing views</span>
            <span className="text-premium-gold">{funnel.view_listing}</span>
          </li>
          <li className="flex justify-between border-b border-white/5 px-3 py-2">
            <span className="text-slate-300">Contact broker</span>
            <span className="text-premium-gold">{funnel.contact_broker}</span>
          </li>
          <li className="flex justify-between px-3 py-2">
            <span className="text-slate-300">Create offer</span>
            <span className="text-premium-gold">{funnel.create_offer}</span>
          </li>
        </ul>
      </div>

      {gd ? (
        <div>
          <p className="text-xs font-semibold text-slate-400">Guided demo ({windowLabel}, distinct users)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Started</p>
              <p className="text-lg font-semibold text-white">{gd.startedUsers}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Completed</p>
              <p className="text-lg font-semibold text-white">{gd.completedUsers}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Completion rate</p>
              <p className="text-lg font-semibold text-emerald-300">{gd.completionRatePct}%</p>
            </div>
          </div>
          {gd.dropOffStep ? (
            <p className="mt-2 text-xs text-amber-200/90">
              Largest step-to-step drop after: <span className="font-mono">{gd.dropOffStep}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Drop-off step appears when step counts diverge.</p>
          )}
          <ul className="mt-2 max-h-36 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
            {(gd.stepCounts ?? []).map((row) => (
              <li key={row.stepId} className="flex justify-between border-b border-white/5 px-3 py-1.5 last:border-0">
                <span className="font-mono text-slate-400">{row.stepId}</span>
                <span className="text-premium-gold">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {da ? (
        <div>
          <p className="text-xs font-semibold text-slate-400">
            AI Deal Analyzer ({windowLabel}) — {DemoEvents.AI_DEAL_ANALYZER_USED} /{" "}
            {DemoEvents.AI_DEAL_ANALYZER_COMPLETED}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Runs</p>
              <p className="text-lg font-semibold text-white">{da.runs}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Completions</p>
              <p className="text-lg font-semibold text-white">{da.completions}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Avg score</p>
              <p className="text-lg font-semibold text-slate-200">
                {da.avgScore != null ? da.avgScore : "—"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Listings analyzed most (by completion events)</p>
          <ul className="mt-1 max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
            {(da.topListings ?? []).length === 0 ? (
              <li className="px-3 py-2 text-slate-500">No data yet.</li>
            ) : (
              (da.topListings ?? []).map((row) => (
                <li key={row.listingId} className="flex justify-between border-b border-white/5 px-3 py-1.5 last:border-0">
                  <span className="truncate font-mono text-slate-400">{row.listingId}</span>
                  <span className="text-premium-gold">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {ms ? (
        <div>
          <p className="text-xs font-semibold text-slate-400">
            Mortgage simulator ({windowLabel}) — {DemoEvents.MORTGAGE_SIMULATOR_USED} / {DemoEvents.SCENARIO_ADDED} /{" "}
            {DemoEvents.SCENARIO_COMPARED}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Views</p>
              <p className="text-lg font-semibold text-white">{ms.used}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Scenarios added</p>
              <p className="text-lg font-semibold text-white">{ms.scenarioAdded}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Compares</p>
              <p className="text-lg font-semibold text-white">{ms.scenarioCompared}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold text-slate-400">Top viewed listings ({windowLabel})</p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
          {(data.topListingViews ?? []).length === 0 ? (
            <li className="px-3 py-2 text-slate-500">No view_listing data yet.</li>
          ) : (
            (data.topListingViews ?? []).map((row) => (
              <li key={row.listingId} className="flex justify-between border-b border-white/5 px-3 py-2 last:border-0">
                <span className="truncate font-mono text-slate-300" title={row.listingId}>
                  {row.listingId.length > 28 ? `${row.listingId.slice(0, 28)}…` : row.listingId}
                </span>
                <span className="text-premium-gold">{row.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Most searched terms ({windowLabel})</p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
          {(data.topSearchQueries ?? []).length === 0 ? (
            <li className="px-3 py-2 text-slate-500">No search events yet.</li>
          ) : (
            (data.topSearchQueries ?? []).map((row) => (
              <li key={row.query} className="flex justify-between border-b border-white/5 px-3 py-2 last:border-0">
                <span className="truncate text-slate-300" title={row.query}>
                  {row.query || "—"}
                </span>
                <span className="text-premium-gold">{row.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Blocked actions (demo mode)</p>
        <p className="mt-1 text-lg font-medium text-amber-200">{data.blockedCount ?? 0}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Most blocked routes ({windowLabel})</p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
          {(data.topBlockedRoutes ?? []).length === 0 ? (
            <li className="px-3 py-2 text-slate-500">No blocked_action metadata yet.</li>
          ) : (
            (data.topBlockedRoutes ?? []).map((row) => (
              <li key={row.route} className="flex justify-between border-b border-white/5 px-3 py-2 last:border-0">
                <span className="truncate font-mono text-slate-300" title={row.route}>
                  {row.route}
                </span>
                <span className="text-premium-gold">{row.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Events by type</p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs">
          {(data.byEvent ?? []).map((row) => (
            <li key={row.event} className="flex justify-between border-b border-white/5 px-3 py-2 last:border-0">
              <span className="text-slate-300">{row.event}</span>
              <span className="text-premium-gold">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">Recent page views (24h)</p>
        <ul className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/20 text-xs text-slate-400">
          {topPages.length === 0 ? (
            <li className="px-3 py-2">No page_view events yet.</li>
          ) : (
            topPages.map((e) => {
              const meta = e.metadata as { path?: string } | null;
              return (
                <li key={e.id} className="border-b border-white/5 px-3 py-1.5 last:border-0">
                  {meta?.path ?? "—"}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
