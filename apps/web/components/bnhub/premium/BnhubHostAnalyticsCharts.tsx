"use client";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212, 175, 55, 0.28)";
const AXIS = "#6b6b6b";
const DONUT_COLORS = ["#D4AF37", "#8B7355", "#4a4a4a", "#2d2d2d", "#c9a227", "#6b5a2f"];

export function BnhubRevenueLineChart({
  data,
}: {
  data: { date: string; cents: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
    dollars: Math.round(d.cents / 100),
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GOLD_DIM} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GOLD_DIM }} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GOLD_DIM }} />
          <Tooltip
            contentStyle={{
              background: "#0f0f0f",
              border: "1px solid #1f1f1f",
              borderRadius: 12,
              color: "#ffffff",
            }}
            formatter={(v: number) => [`$${v}`, "Host payout"]}
          />
          <Line type="monotone" dataKey="dollars" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BnhubBookingStatusDonut({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const chartData = data.filter((d) => d.count > 0);
  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-bnhub-text-muted">No bookings yet</p>;
  }

  return (
    <div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              label={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="#0a0a0a" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f0f0f",
                border: "1px solid #1f1f1f",
                borderRadius: 12,
                color: "#ffffff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] text-bnhub-text-secondary">
        {chartData.map((d, i) => (
          <li key={d.status} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-bnhub-text">{d.status}</span>
            <span className="tabular-nums text-bnhub-text-muted">({d.count})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
