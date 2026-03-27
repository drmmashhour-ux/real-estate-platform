"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type SeriesRow = {
  date: string;
  avgPriceCents: number;
  avgRentCents: number | null;
};

export function MarketCityCharts({ series }: { series: SeriesRow[] }) {
  const priceData = series.map((r) => ({
    t: r.date.slice(0, 7),
    price: r.avgPriceCents / 100,
  }));

  const rentData = series
    .filter((r) => r.avgRentCents != null && r.avgRentCents > 0)
    .map((r) => ({
      t: r.date.slice(0, 7),
      rent: (r.avgRentCents ?? 0) / 100,
    }));

  if (priceData.length === 0) return null;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Average price over time (estimate)</h3>
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Avg price"]} />
              <Legend />
              <Line type="monotone" dataKey="price" name="Avg price" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {rentData.length >= 2 ? (
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Average rent over time (estimate)</h3>
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rentData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}/mo`, "Avg rent"]} />
                <Legend />
                <Line type="monotone" dataKey="rent" name="Avg rent / mo" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
