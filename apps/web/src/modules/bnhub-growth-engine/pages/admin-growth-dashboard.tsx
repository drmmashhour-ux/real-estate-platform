"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { g } from "../components/growth-ui-classes";

export function AdminGrowthDashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/admin/bnhub-growth/overview");
      const j = (await r.json()) as Record<string, unknown> & { error?: string };
      if (!r.ok) setErr(j.error ?? "Failed");
      else setData(j);
    })();
  }, []);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const connectorHealth = (data.connectorHealth as { code: string; status: string; name: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">BNHUB Growth & Lead Engine</h1>
        <p className={g.sub}>
          Autopilot safety caps (env + per-host prefs), connector readiness, centralized leads. ROI on the wire is{" "}
          <span className="text-amber-200/90">attributed / estimated</span> until paid channels sync real spend.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={g.card}>
          <p className={g.sub}>Active campaigns</p>
          <p className="text-2xl font-bold text-amber-400">{String(data.activeCampaigns ?? 0)}</p>
        </div>
        <div className={g.card}>
          <p className={g.sub}>Leads (7d)</p>
          <p className="text-2xl font-bold text-white">{String(data.leadsThisWeek ?? 0)}</p>
        </div>
        <div className={g.card}>
          <p className={g.sub}>Hot leads</p>
          <p className="text-2xl font-bold text-red-300">{String(data.hotLeads ?? 0)}</p>
        </div>
        <div className={g.card}>
          <p className={g.sub}>Autopilot actions today</p>
          <p className="text-2xl font-bold text-zinc-200">{String(data.autopilotActionsToday ?? 0)}</p>
        </div>
      </div>
      <div className={g.card}>
        <h2 className={g.title}>Connector health</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Status comes from DB + last healthcheck. Cross-check env vars on the Connectors page.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {connectorHealth.length === 0 ? (
            <li className="py-3 text-zinc-500">No connector rows — run migrations and seed.</li>
          ) : (
            connectorHealth.map((c) => (
              <li key={c.code} className="flex justify-between gap-2 border-b border-zinc-800/80 py-2">
                <span className="text-zinc-300">{c.name}</span>
                <span className="font-mono text-xs text-amber-200/90">{c.status}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/bnhub/growth/campaigns" className={g.btn}>
          Campaigns
        </Link>
        <Link href="/admin/bnhub/growth/leads" className={g.btnGhost}>
          Leads
        </Link>
        <Link href="/admin/bnhub/growth/connectors" className={g.btnGhost}>
          Connectors
        </Link>
        <Link href="/admin/bnhub/growth/rules" className={g.btnGhost}>
          Rules
        </Link>
      </div>
    </div>
  );
}
