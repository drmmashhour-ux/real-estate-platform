"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MonopolyChartDatum = { name: string; value: number };

/** @deprecated Use MonopolyFlywheelChart — alias kept for `page.tsx` imports. */
export function MonopolyDashboardClient({ data }: { data: MonopolyChartDatum[] }) {
  return <MonopolyFlywheelChart data={data} />;
}

export function MonopolyFlywheelChart({ data }: { data: MonopolyChartDatum[] }) {
  return (
    <div className="h-72 w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">Network inputs (30d)</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend />
          <Bar dataKey="value" name="Count" fill="#d4af37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
