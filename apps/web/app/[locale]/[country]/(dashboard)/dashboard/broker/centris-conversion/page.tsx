"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrokerCentrisManualLeadForm } from "@/components/centris/BrokerCentrisManualLeadForm";

type Domination = {
  analytics: {
    visitSignals: number;
    captures: number;
    leadsWithSignup: number;
    conversionRate: number;
    weakSteps: string[];
    bestCta: string | null;
    avgLeadScore: number | null;
    days: number;
  };
  topListings: Array<{
    listingId: string;
    kind: string;
    title: string;
    city: string | null;
    leadCount: number;
    avgScore: number;
  }>;
};

type Payload = {
  days: number;
  since: string;
  centrisLeads: number;
  convertedToPlatformUsers: number;
  conversionRate?: number;
  revenueCad: number;
  note?: string;
  domination?: Domination;
};

export default function CentrisConversionPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/broker/centris-conversion?days=30&extended=1", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setError(j.error ?? "Unable to load");
          return;
        }
        setData(j);
      })
      .catch(() => setError("Network error"));
  }, []);

  const rate =
    data?.conversionRate != null
      ? data.conversionRate
      : data && data.centrisLeads > 0
        ? Math.round((data.convertedToPlatformUsers / data.centrisLeads) * 1000) / 10
        : null;

  const dom = data?.domination;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Broker hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Centris conversion — Lead Domination</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Leads attributed to Centris syndication on your listings. Share listing links with{" "}
        <code className="rounded bg-slate-900 px-1 text-emerald-300">?src=centris</code> or{" "}
        <code className="rounded bg-slate-900 px-1 text-emerald-300">?dist=centris</code> on LECIPM URLs.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}

      {data && (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Centris leads</h2>
            <p className="mt-2 font-mono text-3xl text-white">{data.centrisLeads}</p>
            <p className="mt-1 text-xs text-slate-500">Last {data.days} days</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signed-in on platform
            </h2>
            <p className="mt-2 font-mono text-3xl text-emerald-300">{data.convertedToPlatformUsers}</p>
            <p className="mt-1 text-xs text-slate-500">
              {rate != null ? `${rate}% conversion to signed-in user` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Revenue (closed)
            </h2>
            <p className="mt-2 font-mono text-3xl text-white">
              {(data.revenueCad ?? 0).toLocaleString("en-CA", {
                style: "currency",
                currency: "CAD",
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500">Final commission recorded</p>
          </div>
          {data.note ? (
            <p className="md:col-span-3 text-xs text-slate-500">{data.note}</p>
          ) : null}
        </div>
      )}

      {dom ? (
        <section className="mt-12 space-y-6">
          <h2 className="text-lg font-semibold text-white">Lead scoring & funnel engine</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-400/80">Avg lead score</p>
              <p className="mt-2 font-mono text-2xl text-white">{dom.analytics.avgLeadScore ?? "—"}</p>
              <p className="mt-1 text-[11px] text-slate-500">Centris deterministic model (0–100)</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">VIEW signals</p>
              <p className="mt-2 font-mono text-2xl text-white">{dom.analytics.visitSignals}</p>
              <p className="mt-1 text-[11px] text-slate-500">FUNNEL_VIEW timeline events</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Best CTA</p>
              <p className="mt-2 text-lg font-medium text-white">{dom.analytics.bestCta ?? "—"}</p>
              <p className="mt-1 text-[11px] text-slate-500">From intent mix on captures</p>
            </div>
          </div>

          {dom.analytics.weakSteps.length > 0 ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Weak steps</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
                {dom.analytics.weakSteps.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white">Top listings by Centris volume</h3>
            <ul className="mt-3 divide-y divide-slate-800">
              {dom.topListings.length === 0 ? (
                <li className="py-2 text-sm text-slate-500">No attributed leads in window.</li>
              ) : (
                dom.topListings.map((row) => (
                  <li key={row.listingId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-medium text-white">{row.title}</span>
                    <span className="text-slate-400">
                      {row.kind.toUpperCase()} · {row.leadCount} leads · avg score {row.avgScore}
                      {row.city ? ` · ${row.city}` : ""}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="mt-10 max-w-2xl">
        <BrokerCentrisManualLeadForm />
      </div>
    </div>
  );
}
