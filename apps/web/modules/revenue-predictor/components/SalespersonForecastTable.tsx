"use client";

import Link from "next/link";

import type { TeamRevenueForecast } from "../revenue-predictor.types";
import { formatCentsAbbrev } from "./formatMoney";

export function SalespersonForecastTable({
  members,
  adminBase,
}: {
  members: TeamRevenueForecast["memberForecasts"];
  adminBase: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Rep</th>
            <th className="px-3 py-2">Base forecast</th>
            <th className="px-3 py-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.userId} className="border-b border-zinc-800/80">
              <td className="px-3 py-2">
                <Link
                  className="text-amber-400 hover:text-amber-300"
                  href={`${adminBase}/ai-sales-manager/${encodeURIComponent(m.userId)}`}
                >
                  {m.displayName ?? m.userId.slice(0, 10)}
                </Link>
              </td>
              <td className="px-3 py-2 text-zinc-200">{formatCentsAbbrev(m.baseCents)}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    m.riskBadge === "high" ? "bg-rose-900/40 text-rose-200"
                    : m.riskBadge === "med" ? "bg-amber-900/40 text-amber-200"
                    : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {m.riskBadge}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
