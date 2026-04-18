"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminBnhubPayload = {
  generatedAt: string;
  publishedListings: number;
  bookingsLast7d: number;
  openBnhubFraudFlags: number;
  openDisputes: number;
  links?: { controlSummary: string; legacyAdminBnhub: string };
  error?: string;
};

export function BNHubDashboard() {
  const [data, setData] = useState<AdminBnhubPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/bnhub", { credentials: "include" });
        const j = (await res.json()) as AdminBnhubPayload;
        if (!res.ok) {
          setErr(j.error ?? "Forbidden or feature disabled");
          return;
        }
        setData(j);
      } catch {
        setErr("Could not load BNHub control summary");
      }
    })();
  }, []);

  if (err) {
    return (
      <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200/90">
        BNHub v2 control panel: {err}. Enable <code className="text-xs">FEATURE_BNHUB_ADMIN_CONTROL_V1</code> and sign
        in as a platform admin.
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-zinc-500">Loading BNHub control metrics…</p>;
  }

  const stat = (label: string, value: number, href?: string) => (
    <div className="rounded-xl border border-zinc-800 bg-[#111] p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {href ? (
        <Link href={href} className="mt-2 inline-block text-xs" style={{ color: "#D4AF37" }}>
          Open →
        </Link>
      ) : null}
    </div>
  );

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">BNHub control (v2)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Aggregates from production data — no synthetic metrics. Updated {new Date(data.generatedAt).toLocaleString()}.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Published listings", data.publishedListings, "/admin/bnhub/growth")}
        {stat("Bookings (7d)", data.bookingsLast7d, "/admin/bnhub/booking-growth")}
        {stat("Open fraud flags", data.openBnhubFraudFlags, "/admin/bnhub/trust/risk-flags")}
        {stat("Open disputes", data.openDisputes, "/admin/bnhub/finance/disputes")}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/api/admin/bnhub/fraud" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline">
          API: fraud snapshot
        </Link>
        <Link
          href="/api/admin/bnhub/bookings"
          className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
        >
          API: recent bookings
        </Link>
        {data.links?.controlSummary ? (
          <Link
            href={data.links.controlSummary}
            className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Legacy control summary
          </Link>
        ) : null}
      </div>
    </section>
  );
}
