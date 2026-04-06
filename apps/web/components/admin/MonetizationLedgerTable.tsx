"use client";

import { useMemo } from "react";
import { DetailDrawer } from "@/components/admin/DetailDrawer";

export type MonetizationLedgerRow = {
  id: string;
  createdAtIso: string;
  provider: string;
  paymentStatus: string;
  payoutStatus: string;
  userLabel: string;
  amount: string;
  timeline: string;
  detail: Record<string, unknown>;
};

type Props = {
  rows: MonetizationLedgerRow[];
  emptyMessage?: string;
};

/**
 * Monetization ledger: provider, pay + payout status, payment → payout timeline.
 */
export function MonetizationLedgerTable({ rows, emptyMessage }: Props) {
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r.detail])), [rows]);

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0b0b]">
      <table className="min-w-[920px] w-full text-left text-sm">
        <thead className="border-b border-white/10 text-white/60">
          <tr>
            <th className="px-3 py-3">Time</th>
            <th className="px-3 py-3">Provider</th>
            <th className="px-3 py-3">Pay status</th>
            <th className="px-3 py-3">Payout</th>
            <th className="px-3 py-3">User</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Timeline</th>
            <th className="px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-white/50">
                {emptyMessage ?? "No orchestrated payments in range."}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 transition hover:bg-white/5">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-white/50">{r.createdAtIso}</td>
                <td className="px-3 py-2 capitalize text-sky-300">{r.provider}</td>
                <td className="px-3 py-2 text-white/90">{r.paymentStatus}</td>
                <td className="px-3 py-2 text-amber-200/90">{r.payoutStatus}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-white">{r.userLabel}</td>
                <td className="whitespace-nowrap px-3 py-2 text-white">{r.amount}</td>
                <td className="max-w-xs px-3 py-2 text-xs text-white/60">{r.timeline}</td>
                <td className="px-3 py-2 text-right">
                  <DetailDrawer data={byId.get(r.id) ?? { id: r.id }} triggerLabel="View" title="Ledger row" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
