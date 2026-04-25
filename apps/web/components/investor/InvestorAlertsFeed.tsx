"use client";

import type { InvestorAlert } from "@/modules/investor-intelligence/investor-intelligence.types";

type Props = { alerts: InvestorAlert[]; className?: string };

const sev: Record<InvestorAlert["severity"], string> = {
  info: "border-slate-200 bg-slate-50",
  low: "border-amber-200 bg-amber-50",
  medium: "border-amber-400 bg-amber-50/80",
  high: "border-rose-300 bg-rose-50",
};

export function InvestorAlertsFeed({ alerts, className }: Props) {
  if (alerts.length === 0) return <p className="text-sm text-slate-500">No active alerts in this run.</p>;
  return (
    <ul className={`space-y-2 ${className ?? ""}`} data-testid="investor-alerts">
      {alerts.map((a) => (
        <li
          key={a.type + a.message.slice(0, 20)}
          className={`rounded-lg border p-3 text-sm text-slate-800 ${sev[a.severity]}`}
        >
          <p className="text-xs text-slate-500">{a.type} · {a.severity}</p>
          <p className="font-medium">{a.message}</p>
          <p className="text-xs text-slate-600 mt-1">{a.rationale}</p>
        </li>
      ))}
    </ul>
  );
}
