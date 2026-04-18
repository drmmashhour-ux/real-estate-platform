"use client";

import type { MonthRevenueBreakdown } from "@/modules/launch-simulation/launch-simulation.types";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>
          {value.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-800">
        <div className="h-full rounded bg-gradient-to-r from-amber-600/80 to-amber-400/60" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RevenueBreakdownChart({ month }: { month: MonthRevenueBreakdown }) {
  const r = month.revenueBreakdown;
  const entries: [string, number][] = [
    ["BNHub booking fees", r.bnhubBookingFees],
    ["BNHub subscriptions", r.bnhubSubscriptions],
    ["BNHub boosts", r.bnhubBoosts],
    ["Broker subscriptions", r.brokerSubscriptions],
    ["Broker lead fees", r.brokerLeadFees],
    ["Broker success fees", r.brokerSuccessFees],
    ["Other (doc/AI)", r.otherDocAi],
  ];
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <p className="text-sm font-medium text-zinc-200">Month {month.month} breakdown (projected)</p>
      {entries.map(([label, value]) => (
        <Bar key={label} label={label} value={value} max={max} />
      ))}
    </div>
  );
}
