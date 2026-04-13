"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Payload = {
  periodDays: number;
  since: string;
  totalOrganicLeads: number;
  otherSourceLeads: number;
  totalLeadsInPeriod: number;
  highIntentLeads: number;
  leadsBySource: {
    source: string;
    leads: number;
    won: number;
    conversionRatePct: number;
  }[];
  topOrganicSource: string | null;
  bestConvertingSource: { source: string; conversionRatePct: number } | null;
  dailyLeadFlow: { date: string; leadsCount: number }[];
  dailyTrend: "up" | "down" | "flat";
  last7DaysLeads: number;
  previous7DaysLeads: number;
  engagement: {
    eventsByType: Record<string, number>;
    eventsByAttributedSource: Record<string, number>;
  };
  insights: string[];
};

export function OrganicAnalyticsClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/organic-analytics?days=${days}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDaily = useMemo(() => {
    if (!data?.dailyLeadFlow.length) return 1;
    return Math.max(1, ...data.dailyLeadFlow.map((d) => d.leadsCount));
  }, [data]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-[#B3B3B3]">Loading organic analytics…</p>;

  const trendColor =
    data.dailyTrend === "up" ? "text-emerald-400" : data.dailyTrend === "down" ? "text-rose-400" : "text-[#B3B3B3]";
  const trendLabel =
    data.dailyTrend === "up" ? "↑ Up vs prior week" : data.dailyTrend === "down" ? "↓ Down vs prior week" : "→ Flat vs prior week";

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white sm:w-52"
        >
          {[7, 14, 30, 60, 90].map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
        {data.topOrganicSource ? (
          <p className="rounded-2xl border border-premium-gold/35 bg-premium-gold/10 px-4 py-3 text-sm text-white">
            <span className="font-semibold text-premium-gold">Top organic source: </span>
            {data.topOrganicSource}
          </p>
        ) : null}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-premium-gold/25 bg-[#0B0B0B] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Organic leads</p>
          <p className="mt-2 text-3xl font-semibold text-white">{data.totalOrganicLeads}</p>
          <p className="mt-1 text-xs text-[#B3B3B3]">Facebook · Instagram · WhatsApp · Direct</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B3B3]">All leads (period)</p>
          <p className="mt-2 text-3xl font-semibold text-white">{data.totalLeadsInPeriod}</p>
          {data.otherSourceLeads > 0 ? (
            <p className="mt-1 text-xs text-[#B3B3B3]">Other tagged: {data.otherSourceLeads}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B3B3]">High-intent leads</p>
          <p className="mt-2 text-3xl font-semibold text-premium-gold">{data.highIntentLeads}</p>
          <p className="mt-1 text-xs text-[#B3B3B3]">Call / WhatsApp / 3+ page views</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B3B3B3]">7-day momentum</p>
          <p className={`mt-2 text-2xl font-semibold ${trendColor}`}>{trendLabel}</p>
          <p className="mt-1 text-xs text-[#B3B3B3]">
            Last 7d: {data.last7DaysLeads} · Prior 7d: {data.previous7DaysLeads}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">Insights</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[#E5E5E5]">
          {data.insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
          {data.bestConvertingSource ? (
            <li className="list-none pl-0">
              <span className="text-premium-gold">Best win-rate (≥2 leads):</span>{" "}
              {data.bestConvertingSource.source} ({data.bestConvertingSource.conversionRatePct}%)
            </li>
          ) : null}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Leads by organic source
          </h3>
          <p className="mt-1 text-xs text-[#B3B3B3]">Win rate = pipeline won or deal closed</p>
          <ul className="mt-4 space-y-3">
            {data.leadsBySource.map((r) => (
              <li key={r.source}>
                <div className="flex justify-between text-sm text-white">
                  <span>{r.source}</span>
                  <span className="text-[#B3B3B3]">
                    {r.leads} leads · {r.won} won · {r.conversionRatePct}%
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-premium-gold"
                    style={{
                      width: `${Math.min(100, data.totalOrganicLeads > 0 ? (r.leads / data.totalOrganicLeads) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
            Engagement (events)
          </h3>
          <p className="mt-1 text-xs text-[#B3B3B3]">Attributed source on each event (cookie snapshot)</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#B3B3B3]">By type</p>
              <ul className="mt-2 space-y-1 text-sm text-[#E5E5E5]">
                {["page_view", "evaluation_started", "evaluation_submitted", "CTA_clicked", "call_clicked", "whatsapp_clicked"].map(
                  (k) => (
                    <li key={k} className="flex justify-between gap-2">
                      <span className="font-mono text-xs">{k}</span>
                      <span className="text-premium-gold">{data.engagement.eventsByType[k] ?? 0}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-[#B3B3B3]">By source</p>
              <ul className="mt-2 space-y-1 text-sm text-[#E5E5E5]">
                {Object.entries(data.engagement.eventsByAttributedSource)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-2">
                      <span>{k}</span>
                      <span className="text-premium-gold">{v}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-premium-gold">
          Daily lead flow
        </h3>
        <p className="mt-1 text-xs text-[#B3B3B3]">All new leads per day (UTC date)</p>
        <div className="mt-6 flex h-40 items-end gap-1 sm:gap-0.5">
          {data.dailyLeadFlow.map((d) => (
            <div
              key={d.date}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${d.date}: ${d.leadsCount}`}
            >
              <div
                className="w-full max-w-[10px] rounded-t bg-premium-gold/90 sm:max-w-[14px]"
                style={{ height: `${Math.max(4, (d.leadsCount / maxDaily) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-[#525252]">
          {data.dailyLeadFlow[0]?.date} → {data.dailyLeadFlow[data.dailyLeadFlow.length - 1]?.date}
        </p>
      </section>

      <p className="text-xs text-[#525252]">
        Share links: <code className="text-[#B3B3B3]">?source=instagram&amp;campaign=group_post</code> — same cookie as paid
        flows. ·{" "}
        <Link href="/admin/analytics" className="text-premium-gold hover:underline">
          Full ads analytics
        </Link>
      </p>
    </div>
  );
}
