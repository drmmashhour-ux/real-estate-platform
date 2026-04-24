"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "@/components/autonomy/autonomy-styles";

type DisputeRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  relatedEntityType: string;
  relatedEntityId: string;
  updatedAt: string;
  createdAt: string;
};

type Metrics = {
  totalOpen: number;
  avgResolutionDays: number | null;
  disputeRatePerBooking30d: number | null;
  topCauses: Array<{ category: string; count: number }>;
  conversionImpactNote: string;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, metRes] = await Promise.all([
        fetch("/api/disputes/list", { credentials: "same-origin" }),
        fetch("/api/disputes/metrics", { credentials: "same-origin" }),
      ]);
      const listJ = (await listRes.json().catch(() => ({}))) as { disputes?: DisputeRow[]; error?: string };
      const metJ = (await metRes.json().catch(() => ({}))) as Metrics & { error?: string };
      if (!listRes.ok) {
        setError(listJ?.error ?? "list_failed");
        return;
      }
      setDisputes(listJ.disputes ?? []);
      if (metRes.ok) setMetrics(metJ);
    } catch {
      setError("network_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stalled = disputes.filter((d) => {
    const days = (Date.now() - new Date(d.updatedAt).getTime()) / 86400000;
    return days > 7 && d.status !== "RESOLVED" && d.status !== "REJECTED";
  });
  const escalated = disputes.filter((d) => d.status === "ESCALATED");
  const highPri = disputes.filter((d) => d.priority === "HIGH");

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-[#f4efe4]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-[#D4AF37] hover:underline">
            ← Admin
          </Link>
          <p className={`mt-2 text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Operations</p>
          <h1 className={`mt-1 font-serif text-3xl ${autonomyGoldText}`}>Dispute Room · Admin</h1>
        </div>

        {metrics ?
          <div className={`${autonomyGlassCard} grid gap-4 p-6 md:grid-cols-4`}>
            <Metric label="Open / active" value={String(metrics.totalOpen)} />
            <Metric
              label="Avg resolution (days)"
              value={metrics.avgResolutionDays === null ? "—" : metrics.avgResolutionDays.toFixed(1)}
            />
            <Metric
              label="Dispute rate / booking (30d)"
              value={
                metrics.disputeRatePerBooking30d === null ? "—" : (metrics.disputeRatePerBooking30d * 100).toFixed(2) + "%"
              }
            />
            <div>
              <p className={`text-[11px] uppercase ${autonomyMuted}`}>Top causes</p>
              <ul className="mt-2 space-y-1 text-sm text-[#e8dfd0]">
                {metrics.topCauses.slice(0, 4).map((c) => (
                  <li key={c.category}>
                    {c.category}: {c.count}
                  </li>
                ))}
              </ul>
            </div>
            <p className={`md:col-span-4 text-xs ${autonomyMuted}`}>{metrics.conversionImpactNote}</p>
          </div>
        : null}

        {loading ?
          <p className={`text-sm ${autonomyMuted}`}>Loading…</p>
        : null}
        {error ?
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
        : null}

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`font-serif text-lg ${autonomyGoldText}`}>High priority</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {highPri.slice(0, 8).map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/disputes/${d.id}`} className="text-[#D4AF37] hover:underline">
                  {d.title}
                </Link>
                <span className={`ml-2 text-xs ${autonomyMuted}`}>{d.status}</span>
              </li>
            ))}
            {highPri.length === 0 ?
              <li className={autonomyMuted}>None.</li>
            : null}
          </ul>
        </section>

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`font-serif text-lg ${autonomyGoldText}`}>Stalled (&gt;7d)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stalled.slice(0, 12).map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/disputes/${d.id}`} className="text-[#D4AF37] hover:underline">
                  {d.title}
                </Link>
              </li>
            ))}
            {stalled.length === 0 ?
              <li className={autonomyMuted}>None.</li>
            : null}
          </ul>
        </section>

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`font-serif text-lg ${autonomyGoldText}`}>Escalated</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {escalated.map((d) => (
              <li key={d.id}>
                <Link href={`/dashboard/disputes/${d.id}`} className="text-[#D4AF37] hover:underline">
                  {d.title}
                </Link>
              </li>
            ))}
            {escalated.length === 0 ?
              <li className={autonomyMuted}>None.</li>
            : null}
          </ul>
        </section>

        <section className={`${autonomyGlassCard} p-6`}>
          <h2 className={`font-serif text-lg ${autonomyGoldText}`}>All disputes</h2>
          <div className="mt-4 space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="rounded-lg border border-[#D4AF37]/15 bg-black/40 px-4 py-3">
                <Link href={`/dashboard/disputes/${d.id}`} className="font-medium text-[#D4AF37] hover:underline">
                  {d.title}
                </Link>
                <p className={`mt-1 text-xs ${autonomyMuted}`}>
                  {d.relatedEntityType} · {d.status} · {d.priority} · updated {new Date(d.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div>
      <p className={`text-[11px] uppercase ${autonomyMuted}`}>{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{props.value}</p>
    </div>
  );
}
