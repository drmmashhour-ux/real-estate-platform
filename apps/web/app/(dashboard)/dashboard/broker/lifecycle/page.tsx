"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LifecyclePayload = {
  insights?: {
    leadCounts: { total: number; hot: number; warm: number; cold: number };
    dealsByCrmStage: Record<string, number>;
    retentionDueSoon: number;
    disclaimer: string;
  };
  hotLeads?: { id: string; name: string; score: number; source: string; suggestedActions: string[] }[];
  activeDeals?: {
    id: string;
    status: string;
    crmStage: string | null;
    suggestedActions: string[];
    buyer?: string | null;
    seller?: string | null;
  }[];
  retentionFollowUps?: {
    id: string;
    leadName: string;
    scheduledFor: string;
    templateKey: string;
    draft: { title: string; body: string } | null;
  }[];
  complianceReminder?: string;
  error?: string;
};

export default function BrokerLifecycleCrmPage() {
  const [data, setData] = useState<LifecyclePayload | null>(null);

  useEffect(() => {
    fetch("/api/broker/crm/lifecycle", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (!d || d.error) setData({ error: d?.error ?? "Unable to load" });
        else setData(d);
      })
      .catch(() => setData({ error: "Network error" }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Broker hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Lead lifecycle &amp; CRM</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">
        Before / during / after deal — rule-based suggestions and schedules. AI assists only; brokers close deals.
      </p>

      {data?.error && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {data.error}
        </p>
      )}

      {data?.complianceReminder && (
        <p className="mt-6 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs text-slate-400">
          {data.complianceReminder}
        </p>
      )}

      {data?.insights && !data.error && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
            <p className="text-xs uppercase text-orange-200/80">Hot leads (in view)</p>
            <p className="text-2xl font-semibold">{data.insights.leadCounts.hot}</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-xs uppercase text-amber-200/80">Warm</p>
            <p className="text-2xl font-semibold">{data.insights.leadCounts.warm}</p>
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
            <p className="text-xs uppercase text-sky-200/80">Cold</p>
            <p className="text-2xl font-semibold">{data.insights.leadCounts.cold}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase text-emerald-200/80">Retention (14d)</p>
            <p className="text-2xl font-semibold">{data.insights.retentionDueSoon}</p>
          </div>
          <p className="col-span-full text-xs text-slate-500">{data.insights.disclaimer}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-medium text-emerald-300">Hot leads — suggested actions</h2>
        <ul className="mt-3 space-y-3">
          {!data?.hotLeads?.length && !data?.error && <li className="text-slate-500">No hot leads in recent list.</li>}
          {data?.hotLeads?.map((h) => (
            <li key={h.id} className="rounded-xl border border-orange-500/25 bg-orange-500/5 px-4 py-3 text-sm">
              <p className="font-medium text-white">
                {h.name} · score {h.score} · {h.source}
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
                {h.suggestedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-slate-200">Active deals</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {!data?.activeDeals?.length && !data?.error && <li className="text-slate-500">No active deals.</li>}
          {data?.activeDeals?.map((d) => (
            <li key={d.id} className="rounded-lg border border-slate-800 px-3 py-2">
              <span className="text-slate-300">{d.buyer ?? "Buyer"}</span>
              <span className="text-slate-600"> · </span>
              <span className="text-slate-400">CRM: {d.crmStage ?? "—"}</span>
              <span className="text-slate-600"> · </span>
              <span className="text-slate-500">{d.status}</span>
              <p className="mt-1 text-xs text-emerald-200/80">{d.suggestedActions[0]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-slate-200">Retention follow-ups (next 7 days)</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {!data?.retentionFollowUps?.length && !data?.error && (
            <li className="text-slate-500">No retention touches due this week.</li>
          )}
          {data?.retentionFollowUps?.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3">
              <p className="font-medium text-slate-200">{r.leadName}</p>
              <p className="text-xs text-slate-500">
                {r.templateKey} · {new Date(r.scheduledFor).toLocaleDateString()}
              </p>
              {r.draft && (
                <p className="mt-2 text-xs text-slate-400">
                  <span className="text-slate-500">{r.draft.title}: </span>
                  {r.draft.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-center text-xs text-slate-600">
        <Link href="/dashboard/leads" className="text-emerald-500 hover:underline">
          Open leads pipeline
        </Link>
        {" · "}
        <Link href="/dashboard/deals" className="text-emerald-500 hover:underline">
          Deals
        </Link>
      </p>
    </div>
  );
}
