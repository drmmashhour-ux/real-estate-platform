"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({
  data,
  color,
  valueLabel,
}: {
  data: { label: string; v: number }[];
  color: string;
  valueLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fill: "#888", fontSize: 10 }} />
        <YAxis tick={{ fill: "#888", fontSize: 10 }} width={40} />
        <Tooltip
          contentStyle={{
            background: "#121212",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            color: "#fff",
          }}
          formatter={(v: number | string) => [`${v}`, valueLabel]}
        />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
