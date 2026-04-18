"use client";

import type { MetricSeriesPoint } from "@/modules/metrics/metrics.types";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function GrowthChart({ points, title }: { points: MetricSeriesPoint[]; title: string }) {
  const data = points.map((p) => ({ ...p, name: p.date.slice(5) }));
  return (
    <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
            <YAxis tick={{ fill: "#888", fontSize: 11 }} width={44} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: 8 }}
              formatter={(v: number | string) => [v, ""]}
            />
            <Line type="monotone" dataKey="value" stroke="#d4af37" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
