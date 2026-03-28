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

const GOLD = "var(--color-premium-gold)";

type Row = { date: string; buy_hub: number; seller_hub: number; nbhub: number; mortgage_hub: number };

export function InvestorHubBarChart({ series }: { series: Row[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
          <YAxis tick={{ fill: "#888", fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
          <Legend />
          <Bar dataKey="buy_hub" stackId="a" fill="#38bdf8" name="BuyHub" />
          <Bar dataKey="seller_hub" stackId="a" fill={GOLD} name="SellerHub" />
          <Bar dataKey="nbhub" stackId="a" fill="#4ade80" name="NBHub" />
          <Bar dataKey="mortgage_hub" stackId="a" fill="#a78bfa" name="MortgageHub" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
