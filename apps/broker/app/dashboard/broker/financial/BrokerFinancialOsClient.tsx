"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FinancialCard } from "@/components/ui/FinancialCard";
import { EngineCard } from "@/components/ui/EngineCard";
import type { BrokerTaxesPayload, BrokerTransactionsPayload } from "@/lib/financial/broker-financial-dashboard";

const PIE_COLORS = ["#D4AF37", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#94a3b8", "#fb923c"];

function formatCadFromCents(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function BrokerFinancialOsClient() {
  const [tx, setTx] = useState<BrokerTransactionsPayload | null>(null);
  const [tax, setTax] = useState<BrokerTaxesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, xRes] = await Promise.all([
        fetch("/api/financial/transactions"),
        fetch("/api/financial/taxes"),
      ]);
      if (!tRes.ok) {
        setError("Could not load transactions");
        return;
      }
      if (!xRes.ok) {
        setError("Could not load tax profile");
        return;
      }
      setTx((await tRes.json()) as BrokerTransactionsPayload);
      setTax((await xRes.json()) as BrokerTaxesPayload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-8 text-white/70">
        <p className="text-sm">Loading financial operating system…</p>
      </div>
    );
  }

  if (error || !tx || !tax) {
    return (
      <div className="p-8 text-red-300">
        <p className="text-sm">{error ?? "Failed to load data"}</p>
      </div>
    );
  }

  const pieData = tx.revenueBreakdown;
  const lineData = tx.monthlyTrend.length > 0 ? tx.monthlyTrend : [{ month: "—", revenue: 0 }];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Broker · Financial OS</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Real estate operating system</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Transactions, revenue, commissions, and Québec tax registration — with charts and paths into the appraisal
            engine for valuation support.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              href="/dashboard/broker/financial/transactions"
              className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:border-[#D4AF37]/50"
            >
              Transaction registry
            </Link>
            <Link
              href="/dashboard/broker/financial/revenu-quebec"
              className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:border-[#D4AF37]/50"
            >
              Revenu Québec
            </Link>
          </nav>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialCard
            title="Total revenue (attributed)"
            value={formatCadFromCents(tx.summary.totalRevenueCents)}
            sub={`${tx.summary.transactionCount} rows in view`}
          />
          <FinancialCard
            title="Commissions paid"
            value={formatCadFromCents(tx.summary.commissionsPaidCents)}
            sub="From commission table"
          />
          <FinancialCard
            title="Commissions pending"
            value={formatCadFromCents(tx.summary.commissionsPendingCents)}
            sub="Awaiting payout"
          />
          <FinancialCard
            title="Tax registration"
            value={tax.registrationStatus ?? "Not on file"}
            sub={`Province: ${tax.province}`}
          />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-[#D4AF37]">Valuation engines</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EngineCard title="Comparative Sales" color="gold" href="/dashboard/broker/appraisal/comparative" />
            <EngineCard title="Income Approach" color="blue" href="/dashboard/broker/appraisal/income" />
            <EngineCard title="Cost Approach" color="green" href="/dashboard/broker/appraisal/cost" />
            <EngineCard title="Land / Lot" color="yellow" href="/dashboard/broker/appraisal/land" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black p-4">
            <h2 className="mb-3 text-lg text-[#D4AF37]">Market trend</h2>
            <p className="mb-2 text-xs text-white/50">Broker-attributed revenue by month (CAD)</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-4">
            <h2 className="mb-3 text-lg text-[#D4AF37]">Revenue breakdown</h2>
            <p className="mb-2 text-xs text-white/50">Share by category (CAD)</p>
            {pieData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">
                No category breakdown yet — revenue rows will populate this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                    {pieData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-4">
          <h2 className="text-lg text-[#D4AF37]">AI insights</h2>
          <p className="mt-2 text-sm font-medium text-white">{tx.insights.headline}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{tx.insights.body}</p>
          <p className="mt-3 text-xs text-slate-500">
            Operational summary only — not tax or investment advice. Connect to your AI engine later for deeper narrative.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-4">
          <h2 className="text-lg text-[#D4AF37]">Revenu Québec summary</h2>
          <p className="mt-3 text-sm text-slate-300">
            GST: <span className="text-white">{tax.gstMasked ?? "—"}</span>
          </p>
          <p className="mt-1 text-sm text-slate-300">
            QST: <span className="text-white">{tax.qstMasked ?? "—"}</span>
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Reporting: <span className="text-white">{tax.reporting.frequency}</span>
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Next return:{" "}
            <span className="text-white">{tax.reporting.nextReturnDue ?? "Set with your accountant"}</span>
          </p>
          <p className="mt-3 text-xs text-slate-500">{tax.reporting.note}</p>
        </div>
      </div>
    </div>
  );
}
