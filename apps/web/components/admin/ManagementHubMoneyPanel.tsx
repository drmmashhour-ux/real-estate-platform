"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ManagementHubMoneySnapshot, MoneyWindowKey } from "@/lib/admin/management-hub-money";
import { formatEntityTypeLabel } from "@/lib/admin/management-hub-labels";

const GOLD = "var(--color-premium-gold)";

function cadFromCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function streamChartData(w: ManagementHubMoneySnapshot["windows"][0]) {
  const s = w.streams;
  return [
    { name: "Leads & contacts", cents: s.leadsCents },
    { name: "Bookings & fees", cents: s.bookingsCents },
    { name: "Featured", cents: s.featuredCents },
    { name: "Other checkout", cents: s.otherCents },
  ];
}

function entityChartData(byEntity: Record<string, number>) {
  return Object.entries(byEntity)
    .map(([k, cents]) => ({
      name: formatEntityTypeLabel(k),
      cents,
    }))
    .filter((r) => r.cents > 0)
    .sort((a, b) => b.cents - a.cents);
}

export function ManagementHubMoneyPanel({ snapshot }: { snapshot: ManagementHubMoneySnapshot }) {
  const [tab, setTab] = useState<MoneyWindowKey>("month");

  const active = useMemo(
    () => snapshot.windows.find((w) => w.key === tab) ?? snapshot.windows[2],
    [snapshot.windows, tab]
  );

  const streamRows = useMemo(() => streamChartData(active), [active]);
  const entityRows = useMemo(() => entityChartData(active.byEntityTypeCents), [active.byEntityTypeCents]);

  const maxStream = Math.max(...streamRows.map((r) => r.cents), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {snapshot.windows.map((w) => (
          <button
            key={w.key}
            type="button"
            onClick={() => setTab(w.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === w.key
                ? "bg-premium-gold/20 text-premium-gold ring-1 ring-premium-gold/40"
                : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{active.reportHint}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total (checkout streams)</p>
          <p className="mt-2 text-2xl font-semibold text-white">{cadFromCents(active.streams.totalCents)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Leads & contacts</p>
          <p className="mt-2 text-xl font-semibold text-emerald-300/90">{cadFromCents(active.streams.leadsCents)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Bookings & platform fees</p>
          <p className="mt-2 text-xl font-semibold text-sky-300/90">{cadFromCents(active.streams.bookingsCents)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Revenue events (entity ledger)</p>
          <p className="mt-2 text-xl font-semibold text-amber-200/90">{cadFromCents(active.entityTypeTotalCents)}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Which product line paid most (checkout)</h3>
          <p className="mt-1 text-xs text-slate-500">Immobilier leads, BNHUB booking fees, featured slots, other.</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streamRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgb(var(--premium-gold-channels) / 0.3)",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => [cadFromCents(v), ""]}
                />
                <Bar dataKey="cents" name="Amount" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {maxStream === 0 && <p className="text-sm text-slate-500">No paid checkout in this window.</p>}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Ledger events by source (`entity_type`)</h3>
          <p className="mt-1 text-xs text-slate-500">Platform revenue events — complements Stripe checkout totals.</p>
          <div className="mt-4 h-64 w-full">
            {entityRows.length === 0 ? (
              <p className="text-sm text-slate-500">No realized revenue events in this window.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entityRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} interval={0} angle={-12} textAnchor="end" height={56} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid rgb(var(--premium-gold-channels) / 0.3)",
                      borderRadius: 8,
                    }}
                    formatter={(v: number) => [cadFromCents(v), ""]}
                  />
                  <Bar dataKey="cents" name="Ledger" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-600">
        Generated {new Date(snapshot.generatedAt).toLocaleString("en-CA")} · Checkout streams use{" "}
        <code className="text-slate-500">platform_payments</code> + booking platform fees; ledger uses{" "}
        <code className="text-slate-500">platform_revenue_events</code>.
      </p>
    </div>
  );
}
