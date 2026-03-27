"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  enforceableSignedContracts: number;
  platformPaymentsLinkedToContract: number;
  commissionLedgerRows: number;
  platformLegalDisputesOpen: number;
  bnhubPaymentsWithPayoutSchedule: number;
};

type DisputeRow = {
  id: string;
  type: string;
  status: string;
  bookingId: string | null;
  listingId: string | null;
  leadId: string | null;
  openedByUserId: string;
  description: string;
  createdAt: string;
};

export function LegalFinanceAdminClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetch("/api/admin/legal-finance/summary").then((r) => r.json()),
      fetch("/api/admin/platform-legal-disputes?take=30").then((r) => r.json()),
    ])
      .then(([s, d]) => {
        if (cancelled) return;
        if (s.error) setErr(s.error);
        else setSummary(s);
        if (d.data) setDisputes(d.data);
      })
      .catch(() => {
        if (!cancelled) setErr("Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 text-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-white">Legal + financial control</h2>
        <p className="mt-1 text-sm text-slate-500">
          Contracts linked to payments, commission ledger, BNHub payouts, and platform disputes.
        </p>
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Signed enforceable contracts" value={summary.enforceableSignedContracts} href="/admin/enforceable-contracts" />
          <Stat label="Platform payments w/ contract ref" value={summary.platformPaymentsLinkedToContract} href="/admin/finance/transactions" />
          <Stat label="Commission ledger rows" value={summary.commissionLedgerRows} href="/admin/commissions" />
          <Stat label="Open platform disputes" value={summary.platformLegalDisputesOpen} />
          <Stat label="BNHub payments (payout scheduled)" value={summary.bnhubPaymentsWithPayoutSchedule} href="/admin/bookings" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/api/admin/legal-finance/export"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          Export commission CSV
        </Link>
        <Link href="/admin/enforceable-contracts" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">
          Enforceable contracts
        </Link>
        <Link href="/admin/immo-logs" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5">
          ImmoContact logs
        </Link>
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent platform disputes</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 bg-black/40 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">IDs</th>
                <th className="px-3 py-2">Opened</th>
              </tr>
            </thead>
            <tbody>
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    No disputes yet.
                  </td>
                </tr>
              ) : (
                disputes.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-2">
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">{d.status}</span>
                    </td>
                    <td className="px-3 py-2">{d.type}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                      {d.bookingId ? `booking ${d.bookingId.slice(0, 8)}…` : ""}
                      {d.listingId ? ` listing ${d.listingId.slice(0, 8)}…` : ""}
                      {d.leadId ? ` lead ${d.leadId.slice(0, 8)}…` : ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
    </>
  );
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      {href ? (
        <Link href={href} className="block hover:opacity-90">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
