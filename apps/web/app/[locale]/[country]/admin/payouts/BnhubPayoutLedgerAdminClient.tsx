"use client";

import { useCallback, useEffect, useState } from "react";

type Orchestrated = {
  id: string;
  bookingId: string | null;
  hostId: string;
  amountCents: number;
  currency: string;
  status: string;
  payoutMethod: string;
  scheduledAt: string | null;
  availableAt: string | null;
  paidAt: string | null;
  providerRef: string | null;
  failureReason: string | null;
  host: { email: string | null; stripeAccountId: string | null; stripeOnboardingComplete: boolean };
};

type Manual = {
  id: string;
  bookingId: string;
  hostUserId: string;
  amountCents: number;
  status: string;
  queueReason: string | null;
  host: { email: string | null };
};

export function BnhubPayoutLedgerAdminClient() {
  const [orch, setOrch] = useState<Orchestrated[]>([]);
  const [manual, setManual] = useState<Manual[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const q = filter.trim() ? `?status=${encodeURIComponent(filter.trim())}` : "";
    const r = await fetch(`/api/admin/payouts${q}`, { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    setOrch(Array.isArray(j.orchestrated) ? j.orchestrated : []);
    setManual(Array.isArray(j.manual) ? j.manual : []);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(id: string) {
    setBusy(id);
    try {
      await fetch("/api/admin/payouts/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orchestratedPayoutId: id }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function markPaid(id: string) {
    const referenceNote = window.prompt("Reference / note (optional)") ?? "";
    setBusy(id);
    try {
      await fetch("/api/admin/payouts/mark-manual-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualPayoutId: id, referenceNote }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase text-slate-500">Filter status</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="e.g. scheduled, failed, queued"
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300"
        >
          Refresh
        </button>
      </div>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Orchestrated (Stripe Connect)</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-500">
              <tr>
                <th className="p-2">Host</th>
                <th className="p-2">Booking</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Transfer</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orch.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No rows.
                  </td>
                </tr>
              ) : (
                orch.map((o) => (
                  <tr key={o.id} className="border-t border-slate-800">
                    <td className="p-2">{o.host.email}</td>
                    <td className="p-2 font-mono">{o.bookingId?.slice(0, 8) ?? "—"}</td>
                    <td className="p-2">{(o.amountCents / 100).toFixed(2)} {o.currency}</td>
                    <td className="p-2">{o.status}</td>
                    <td className="p-2 font-mono text-[10px]">{o.providerRef ?? "—"}</td>
                    <td className="p-2">
                      {o.status === "failed" ? (
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => void retry(o.id)}
                          className="rounded border border-amber-800 px-2 py-0.5 text-amber-200"
                        >
                          Retry
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Manual queue</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-500">
              <tr>
                <th className="p-2">Host</th>
                <th className="p-2">Booking</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {manual.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No rows.
                  </td>
                </tr>
              ) : (
                manual.map((m) => (
                  <tr key={m.id} className="border-t border-slate-800">
                    <td className="p-2">{m.host.email}</td>
                    <td className="p-2 font-mono">{m.bookingId.slice(0, 8)}</td>
                    <td className="p-2">{(m.amountCents / 100).toFixed(2)}</td>
                    <td className="p-2 text-rose-200/90">{m.queueReason ?? "—"}</td>
                    <td className="p-2">
                      {m.status === "queued" ? (
                        <button
                          type="button"
                          disabled={busy === m.id}
                          onClick={() => void markPaid(m.id)}
                          className="rounded border border-emerald-800 px-2 py-0.5 text-emerald-200"
                        >
                          Mark paid
                        </button>
                      ) : (
                        m.status
                      )}
                    </td>
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
