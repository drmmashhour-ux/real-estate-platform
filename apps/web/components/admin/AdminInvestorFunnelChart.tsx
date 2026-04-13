"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InvestorPlatformFunnel } from "@/src/modules/investor-metrics/investorFunnel";

const COLORS = ["#34d399", "#22d3ee", "#fbbf24", "#f472b6"];

export function AdminInvestorFunnelChart({ funnel }: { funnel: InvestorPlatformFunnel }) {
  const data = [
    { name: "Visitor sessions", value: funnel.visitorSessions, hint: "Distinct page_view sessions" },
    { name: "Listing views", value: Math.max(funnel.searchListingViews, funnel.crmListingViews), hint: "max(search, CRM funnel)" },
    { name: "Bookings", value: funnel.bookingsCreated, hint: "Created in window" },
    { name: "Payments", value: funnel.paymentsCompleted, hint: "BNHub completed" },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Acquisition funnel (30d)</h3>
      <p className="mt-0.5 text-[11px] text-slate-600">{funnel.methodology.slice(0, 200)}…</p>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: "#09090b", border: "1px solid #3f3f46", maxWidth: 320 }}
              formatter={(value: number) => [Number(value).toLocaleString(), "Count"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={data[i]!.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <dt className="text-slate-600">Session → listing view</dt>
          <dd className="font-mono text-slate-300">
            {funnel.rates.sessionToListingView != null
              ? `${(funnel.rates.sessionToListingView * 100).toFixed(2)}%`
              : "n/a"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-600">Listing view → booking</dt>
          <dd className="font-mono text-slate-300">
            {funnel.rates.listingViewToBooking != null
              ? `${(funnel.rates.listingViewToBooking * 100).toFixed(2)}%`
              : "n/a"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-600">Booking → payment</dt>
          <dd className="font-mono text-slate-300">
            {funnel.rates.bookingToPayment != null
              ? `${(funnel.rates.bookingToPayment * 100).toFixed(2)}%`
              : "n/a"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-600">Session → payment</dt>
          <dd className="font-mono text-slate-300">
            {funnel.rates.sessionToPayment != null
              ? `${(funnel.rates.sessionToPayment * 100).toFixed(2)}%`
              : "n/a"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
