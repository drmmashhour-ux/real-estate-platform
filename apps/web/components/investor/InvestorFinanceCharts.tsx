"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FullFinancialModel } from "@/modules/finance/investor-financial-model";

const GOLD = "#C9A646";
const COLORS = ["#C9A646", "#a88a2e", "#d4b45c", "#8b7355", "#5c4d3a", "#3d3429"];

type Props = {
  model: FullFinancialModel;
};

export function InvestorFinanceCharts({ model }: Props) {
  const { payload, projections } = model;
  const pieData = payload.revenueBySource
    .filter((r) => r.totalCents > 0)
    .map((r) => ({ name: r.label, value: Math.round(r.totalCents / 100) }));

  const monthlyData =
    payload.monthlyRevenueTotal.length > 0
      ? payload.monthlyRevenueTotal.map((m) => ({
          month: m.label,
          revenue: Math.round(m.cents / 100),
        }))
      : [{ month: "—", revenue: 0 }];

  const projectionBars = projections.map((p) => ({
    name: p.label.replace(/\s*\([^)]*\)/, "").trim(),
    revenue: Math.round(p.projectedRevenueCents / 100),
    profit: Math.round(p.projectedProfitCents / 100),
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold text-white">Revenue by source</h3>
        <p className="text-xs text-slate-500">Share of attributed platform revenue</p>
        <div className="mt-4 h-[280px]">
          {pieData.length === 0 ? (
            <p className="py-20 text-center text-sm text-slate-500">No revenue in period</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "CAD"]}
                  contentStyle={{ background: "#111", border: "1px solid #333" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold text-white">Monthly revenue</h3>
        <p className="text-xs text-slate-500">Platform-attributed total (CAD)</p>
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                contentStyle={{ background: "#111", border: "1px solid #333" }}
              />
              <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white">Growth projection (illustrative)</h3>
        <p className="text-xs text-slate-500">Scales annualized run-rate — not a financial forecast</p>
        <div className="mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectionBars}>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                contentStyle={{ background: "#111", border: "1px solid #333" }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#C9A646" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#4ade80" name="Profit (after modeled costs)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
