"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export type TrustHistoryChartPoint = { at: string; score: number };

export function TrustHistoryChart(props: { points: TrustHistoryChartPoint[] }) {
  const data = [...props.points].reverse().map((p) => ({
    ...p,
    label: new Date(p.at).toLocaleDateString(),
  }));

  if (data.length === 0) {
    return <p className="text-xs text-zinc-500">No history yet — run a compute job to populate trends.</p>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(212,175,55,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#a29e94", fontSize: 10 }} axisLine={{ stroke: "rgba(212,175,55,0.2)" }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#a29e94", fontSize: 10 }} axisLine={{ stroke: "rgba(212,175,55,0.2)" }} />
          <Tooltip
            contentStyle={{ background: "#0c0c0c", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12 }}
            labelStyle={{ color: "#e8dfd0" }}
          />
          <Line type="monotone" dataKey="score" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3, fill: "#D4AF37" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
