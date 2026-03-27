"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const GOLD = "#C9A646";

export function AdminReportRevenueChart({ byHub }: { byHub: Record<string, number> }) {
  const data = Object.entries(byHub).map(([name, cents]) => ({
    name: name.length > 14 ? `${name.slice(0, 12)}…` : name,
    value: Math.round(cents / 100),
  }));
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No paid revenue in this window by hub label.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#111", border: "1px solid rgba(201,166,70,0.3)", borderRadius: 8 }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, "CAD"]}
          />
          <Bar dataKey="value" name="Revenue (CAD)" fill={GOLD} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
