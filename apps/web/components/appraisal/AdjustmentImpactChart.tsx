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

export type AdjustmentChartRow = { name: string; original: number; adjusted: number };

export default function AdjustmentImpactChart({
  data,
  className = "",
}: {
  data: AdjustmentChartRow[];
  className?: string;
}) {
  if (!data.length) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50 ${className}`}
      >
        Adjusted comparable price chart appears after you generate proposals and approve adjustments.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-black/70 to-black/45 p-4 text-white shadow-[inset_0_1px_0_0_rgba(212,175,55,0.12)] ${className}`}
    >
      <div className="mb-3 font-serif text-lg font-semibold text-[#D4AF37]">Original vs adjusted</div>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }} />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.35)",
                borderRadius: 8,
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="original" name="Original" fill="rgba(255,255,255,0.28)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="adjusted" name="Adjusted" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
