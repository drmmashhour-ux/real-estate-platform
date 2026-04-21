"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrokerCentrisManualLeadForm } from "@/components/centris/BrokerCentrisManualLeadForm";

type Payload = {
  days: number;
  since: string;
  centrisLeads: number;
  convertedToPlatformUsers: number;
  revenueCad: number;
  note?: string;
};

export default function CentrisConversionPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/broker/centris-conversion?days=30", { credentials: "same-origin" })
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
    data && data.centrisLeads > 0
      ? Math.round((data.convertedToPlatformUsers / data.centrisLeads) * 1000) / 10
      : null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Broker hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Centris conversion</h1>
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
              {rate != null ? `${rate}% of Centris leads` : "—"}
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

      <div className="mt-10 max-w-2xl">
        <BrokerCentrisManualLeadForm />
      </div>
    </div>
  );
}
