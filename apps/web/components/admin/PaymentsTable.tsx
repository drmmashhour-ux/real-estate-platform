"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export type PaymentsTableRow = {
  id: string;
  user: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  /** When set, "View" navigates here (platform / orchestration / booking ledger). */
  viewHref?: string;
  /** When set, "Refund" opens BNHUB finance refunds (or similar). */
  refundHref?: string;
};

type Props = {
  rows: PaymentsTableRow[];
  onView?: (row: PaymentsTableRow) => void;
  onRefund?: (row: PaymentsTableRow) => void;
  /** When set, replaces the default View / Refund buttons (e.g. per-row `DetailDrawer`). */
  renderActions?: (row: PaymentsTableRow) => ReactNode;
  emptyMessage?: string;
};

function statusClass(s: PaymentsTableRow["status"]) {
  if (s === "paid") return "bg-emerald-500/10 text-emerald-400";
  if (s === "pending") return "bg-yellow-500/10 text-yellow-400";
  return "bg-red-500/10 text-red-400";
}

/**
 * Dark admin payments table with status pills and row actions.
 */
export function PaymentsTable({ rows, onView, onRefund, renderActions, emptyMessage }: Props) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0b0b]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-white/10 text-white/60">
          <tr>
            <th className="px-4 py-3 text-left">User</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-white/50">
                {emptyMessage ?? "No payments to show."}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 transition hover:bg-white/5">
                <td className="px-4 py-3 text-white">{r.user}</td>
                <td className="px-4 py-3 text-white">{r.amount}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusClass(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {renderActions ? (
                    <div className="flex justify-end gap-2">{renderActions(r)}</div>
                  ) : (
                    <>
                      {r.viewHref ? (
                        <Link
                          href={r.viewHref}
                          className="mr-3 inline-block text-[#D4AF37] hover:underline"
                          prefetch={false}
                        >
                          View
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="mr-3 text-[#D4AF37] hover:underline"
                          onClick={() => onView?.(r)}
                        >
                          View
                        </button>
                      )}
                      {r.refundHref ? (
                        <Link
                          href={r.refundHref}
                          className="inline-block text-white/70 hover:text-white"
                          prefetch={false}
                        >
                          Refund
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="text-white/70 hover:text-white"
                          onClick={() => onRefund?.(r)}
                        >
                          Refund
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
