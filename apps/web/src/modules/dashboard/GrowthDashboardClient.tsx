"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GrowthDashboardClientProps = {
  totals: { users: number; leads: number; bookings: number; revenueCents30d: number };
  funnel: { eventType: string; count: number }[];
  rates: { signupRate: number; leadRate: number; paymentRate: number };
  series: { date: string; count: number }[];
};

function formatCad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function GrowthDashboardClient({ totals, funnel, rates, series }: GrowthDashboardClientProps) {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={totals.users} />
        <Stat label="Leads" value={totals.leads} />
        <Stat label="Bookings" value={totals.bookings} />
        <Stat label="Revenue (30d)" value={formatCad(totals.revenueCents30d)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-amber-200/90">Events over time</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Line type="monotone" dataKey="count" stroke="#d4af37" dot={false} name="Events" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-amber-200/90">Funnel (30d)</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel.map((f) => ({ name: f.eventType.replace(/_/g, " "), value: f.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Bar dataKey="value" fill="#c084fc" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h3 className="text-sm font-semibold text-amber-200/90">Conversion rates (approx.)</h3>
        <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
          <li>Signup rate (signup / views): {rates.signupRate}%</li>
          <li>Lead rate (inquiry / signups): {rates.leadRate}%</li>
          <li>Payment rate (payment / inquiries): {rates.paymentRate}%</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
