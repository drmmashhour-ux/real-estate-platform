"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Dashboard = {
  periodDays: number;
  since: string;
  totalVisitors: number;
  totalPageViews: number;
  totalLeads: number;
  leadConversionFromVisitorsPct: number;
  evaluationStarted: number;
  evaluationSubmitted: number;
  evalSubmittedPerPageViewPct: number;
  evalSubmittedPerStartedPct: number;
  manualAdSpendCad: number;
  costPerLeadCad: number | null;
  leadsBySource: { source: string; leads: number; won: number; conversionRatePct: number }[];
  leadsByCampaign: { campaign: string; leads: number; won: number; conversionRatePct: number }[];
  bestCampaignByLeads: string | null;
  bestCampaignByConversion: { campaign: string; conversionRatePct: number } | null;
  heat: {
    mostVisitedPages: { path: string; views: number }[];
    mostClickedButtons: { eventType: string; clicks: number }[];
  };
  retargeting: {
    anonymousSessionsEvaluateNoSubmit: number;
    usersMarkedRetargetCandidate: number;
  };
  topCities: { city: string; leads: number }[];
  rawEventCounts: Record<string, number>;
};

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-[#0B0B0B] p-5 shadow-lg shadow-black/40">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[#B3B3B3]">{hint}</p> : null}
    </div>
  );
}

export function AnalyticsDashboardClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Dashboard | null>(null);
  const [spendInput, setSpendInput] = useState("");
  const [spendSaved, setSpendSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/analytics-dashboard?days=${days}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed to load analytics");
      setData(j);
      setSpendInput(String(j.manualAdSpendCad ?? 0));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSpend() {
    setSpendSaved(false);
    const n = Number(spendInput);
    if (!Number.isFinite(n) || n < 0) return;
    const res = await fetch("/api/admin/marketing-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manualAdSpendCad: Math.round(n) }),
    });
    if (res.ok) {
      setSpendSaved(true);
      void load();
    }
  }

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-[#B3B3B3]">Loading analytics…</p>;
  }

  const bestLine =
    data.bestCampaignByLeads || data.bestCampaignByConversion
      ? [
          data.bestCampaignByLeads ? `Most leads: ${data.bestCampaignByLeads}` : null,
          data.bestCampaignByConversion
            ? `Best win-rate (≥2 leads): ${data.bestCampaignByConversion.campaign} (${data.bestCampaignByConversion.conversionRatePct}%)`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "No campaign-tagged leads in this period yet.";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-premium-gold">
            Period
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 block w-full rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white sm:w-48"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-[#B3B3B3]">
          <span className="text-premium-gold">Best performing campaign: </span>
          {bestLine}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Unique visitors" value={data.totalVisitors.toLocaleString()} hint="Distinct sessions (page_view)" />
        <Card title="Page views" value={data.totalPageViews.toLocaleString()} />
        <Card title="Total leads" value={data.totalLeads.toLocaleString()} />
        <Card
          title="Lead conv. (visitors)"
          value={`${data.leadConversionFromVisitorsPct}%`}
          hint="Leads ÷ unique visitors"
        />
        <Card title="Evaluation started" value={data.evaluationStarted.toLocaleString()} />
        <Card title="Evaluation submitted" value={data.evaluationSubmitted.toLocaleString()} />
        <Card
          title="Eval / page view"
          value={`${data.evalSubmittedPerPageViewPct}%`}
          hint="Submissions ÷ page views (ads funnel)"
        />
        <Card
          title="Eval / started"
          value={`${data.evalSubmittedPerStartedPct}%`}
          hint="Submissions ÷ evaluation_started"
        />
      </section>

      <section className="rounded-2xl border border-premium-gold/20 bg-[#0B0B0B] p-6">
        <h2 className="text-lg font-semibold text-white">Ad spend &amp; CPL</h2>
        <p className="mt-1 text-sm text-[#B3B3B3]">
          Manual total spend for the period (CAD, whole dollars). Cost per lead = spend ÷ leads.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            min={0}
            value={spendInput}
            onChange={(e) => setSpendInput(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white sm:w-56"
          />
          <button
            type="button"
            onClick={() => void saveSpend()}
            className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
          >
            Save spend
          </button>
          {data.costPerLeadCad != null ? (
            <p className="text-sm text-white">
              Cost / lead:{" "}
              <span className="font-semibold text-premium-gold">${data.costPerLeadCad}</span>
            </p>
          ) : (
            <p className="text-sm text-[#B3B3B3]">Set spend &gt; 0 and ensure leads exist to see CPL.</p>
          )}
          {spendSaved ? <span className="text-xs text-emerald-400">Saved</span> : null}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Leads by source
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {data.leadsBySource.length === 0 ? (
              <li className="text-[#B3B3B3]">No leads in period.</li>
            ) : (
              data.leadsBySource.map((r) => (
                <li
                  key={r.source}
                  className="flex justify-between gap-2 border-b border-white/5 py-2 text-[#E5E5E5]"
                >
                  <span>{r.source}</span>
                  <span className="text-[#B3B3B3]">
                    {r.leads} leads · {r.won} won · {r.conversionRatePct}%
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Leads by campaign
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {data.leadsByCampaign.length === 0 ? (
              <li className="text-[#B3B3B3]">Use ?campaign= or utm_campaign on ads.</li>
            ) : (
              data.leadsByCampaign.map((r) => (
                <li
                  key={r.campaign}
                  className="flex justify-between gap-2 border-b border-white/5 py-2 text-[#E5E5E5]"
                >
                  <span>{r.campaign}</span>
                  <span className="text-[#B3B3B3]">
                    {r.leads} · {r.won} won · {r.conversionRatePct}%
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Top cities (eval leads)
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {data.topCities.length === 0 ? (
              <li className="text-[#B3B3B3]">No evaluation leads in period.</li>
            ) : (
              data.topCities.slice(0, 12).map((r) => (
                <li
                  key={r.city}
                  className="flex justify-between gap-2 border-b border-white/5 py-2 text-[#E5E5E5]"
                >
                  <span>{r.city}</span>
                  <span className="text-[#B3B3B3]">{r.leads} leads</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Retargeting prep
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-[#E5E5E5]">
            <li className="flex justify-between gap-2">
              <span className="text-[#B3B3B3]">Sessions: evaluate started, no submit</span>
              <span className="font-semibold text-amber-200">
                {data.retargeting.anonymousSessionsEvaluateNoSubmit}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-[#B3B3B3]">Users flagged (logged-in)</span>
              <span className="font-semibold text-amber-200">
                {data.retargeting.usersMarkedRetargetCandidate}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Most visited pages
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {data.heat.mostVisitedPages.length === 0 ? (
              <li className="text-[#B3B3B3]">No page views yet.</li>
            ) : (
              data.heat.mostVisitedPages.map((r) => (
                <li
                  key={r.path}
                  className="flex justify-between gap-2 border-b border-white/5 py-2 text-[#E5E5E5]"
                >
                  <span className="max-w-[70%] truncate font-mono text-xs">{r.path}</span>
                  <span className="text-[#B3B3B3]">{r.views}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Most clicked (CTA / call / WhatsApp)
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {data.heat.mostClickedButtons.length === 0 ? (
              <li className="text-[#B3B3B3]">No CTA events yet.</li>
            ) : (
              data.heat.mostClickedButtons.map((r) => (
                <li
                  key={r.eventType}
                  className="flex justify-between gap-2 border-b border-white/5 py-2 text-[#E5E5E5]"
                >
                  <span>{r.eventType}</span>
                  <span className="text-[#B3B3B3]">{r.clicks}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
          Raw event counts
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data.rawEventCounts).map(([k, v]) => (
            <span
              key={k}
              className="rounded-full border border-white/10 bg-[#0B0B0B] px-3 py-1 text-xs text-[#B3B3B3]"
            >
              {k}: <span className="text-premium-gold">{v}</span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#525252]">
          Detailed attribution:{" "}
          <Link href="/admin/attribution" className="text-premium-gold hover:underline">
            Traffic &amp; attribution
          </Link>
        </p>
      </section>
    </div>
  );
}
