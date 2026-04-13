"use client";

import { useMemo, useState } from "react";
import type { FinancialProjections } from "@/src/modules/investor-metrics/investorProjections";

type Display = {
  totalUsers: number;
  activeUsers: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
};

export function InvestorFinancialsClient({
  display,
  projections,
  bnhub30d,
}: {
  display: Display;
  projections: FinancialProjections;
  bnhub30d: {
    grossRevenueCents: number;
    platformFeeCents: number;
    paidBookings30d: number;
    paymentCount30d: number;
  };
}) {
  const [convPct, setConvPct] = useState(Math.round(display.conversionRate * 1000) / 10);
  const [avgBooking, setAvgBooking] = useState(
    display.bookings > 0 ? Math.round((display.revenue / display.bookings) * 100) / 100 : 120,
  );
  const [commissionPct, setCommissionPct] = useState(12);

  const scenario = useMemo(() => {
    const conv = Math.min(100, Math.max(0, convPct)) / 100;
    const comm = Math.min(50, Math.max(0, commissionPct)) / 100;
    const active = display.activeUsers;
    const monthlyBookings = active * conv;
    const monthlyGmv = monthlyBookings * avgBooking;
    const monthlyPlatformRev = monthlyGmv * comm;
    return { monthlyBookings, monthlyGmv, monthlyPlatformRev };
  }, [convPct, commissionPct, avgBooking, display.activeUsers]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold text-amber-200">Trailing snapshot (30d)</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>
              Revenue (revenue_event): <span className="text-amber-100/90">{display.revenue.toFixed(2)}</span>
            </li>
            <li>
              Bookings (confirmed/completed in engine): <span className="text-amber-100/90">{display.bookings}</span>
            </li>
            <li>
              Lead conversion: <span className="text-amber-100/90">{(display.conversionRate * 100).toFixed(1)}%</span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold text-amber-200">BNHub payments (30d)</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>
              Gross charged (cents):{" "}
              <span className="text-amber-100/90">{bnhub30d.grossRevenueCents.toLocaleString()}</span>
            </li>
            <li>
              Platform fees (cents, sum):{" "}
              <span className="text-amber-100/90">{bnhub30d.platformFeeCents.toLocaleString()}</span>
            </li>
            <li>
              Paid bookings (30d): <span className="text-amber-100/90">{bnhub30d.paidBookings30d}</span> · Payments:{" "}
              {bnhub30d.paymentCount30d}
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-950/80 p-5">
          <h2 className="text-sm font-semibold text-amber-200">Illustrative projections</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>
              ARR (×12): <span className="text-amber-100/90">{projections.annualRunRate.toFixed(0)}</span>
            </li>
            <li>
              90d (simple): <span className="text-amber-100/90">{projections.projectedRevenue90d.toFixed(0)}</span>
            </li>
            <li className="text-xs text-zinc-600">{projections.disclaimer}</li>
          </ul>
        </div>
      </div>

      <section className="rounded-2xl border border-amber-500/25 bg-black/60 p-6">
        <h2 className="font-serif text-lg text-amber-100">Scenario model (editable)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Adjust assumptions to stress-test platform take on GMV. Not audited; for internal narrative only.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <label className="block text-sm">
            <span className="text-zinc-500">Conversion % (active → booking / month)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-amber-100"
              value={convPct}
              min={0}
              max={100}
              step={0.1}
              onChange={(e) => setConvPct(parseFloat(e.target.value) || 0)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500">Avg booking value ({display.revenue > 0 ? "currency units" : "units"})</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-amber-100"
              value={avgBooking}
              min={0}
              step={1}
              onChange={(e) => setAvgBooking(parseFloat(e.target.value) || 0)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500">Effective commission % on GMV</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-amber-100"
              value={commissionPct}
              min={0}
              max={50}
              step={0.5}
              onChange={(e) => setCommissionPct(parseFloat(e.target.value) || 0)}
            />
          </label>
        </div>
        <dl className="mt-8 grid gap-4 border-t border-zinc-900 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase text-zinc-600">Implied monthly bookings</dt>
            <dd className="text-xl font-semibold text-amber-200">{scenario.monthlyBookings.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-zinc-600">Implied monthly GMV</dt>
            <dd className="text-xl font-semibold text-amber-200">{scenario.monthlyGmv.toFixed(0)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-zinc-600">Implied monthly platform revenue</dt>
            <dd className="text-xl font-semibold text-amber-200">{scenario.monthlyPlatformRev.toFixed(0)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
