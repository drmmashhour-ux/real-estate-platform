"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CommissionRow = {
  id: string;
  brokerAmountCents: number;
  broker: { id: string; email: string; name: string | null } | null;
  payment: { paymentType: string; amountCents: number; createdAt: string; id: string };
};

type PayoutRow = {
  id: string;
  status: string;
  payoutMethod: string;
  totalAmountCents: number;
  currency: string;
  approvedAt: string | null;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
  broker: { email: string; name: string | null };
  lines: { commissionId: string; commission: { brokerAmountCents: number } }[];
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function BrokerPayoutsClient() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [pending, setPending] = useState<CommissionRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [brokerFilter, setBrokerFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/finance/payouts?includePendingCommissions=1");
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setPayouts(json.payouts ?? []);
      setPending(json.pendingCommissions ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredPending = useMemo(() => {
    if (!brokerFilter) return pending;
    return pending.filter((c) => c.broker?.id === brokerFilter);
  }, [pending, brokerFilter]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  const selectedBrokerId = useMemo(() => {
    const first = filteredPending.find((c) => selected[c.id]);
    return first?.broker?.id ?? null;
  }, [filteredPending, selected]);

  async function createBatch() {
    setMessage(null);
    if (selectedIds.length === 0 || !selectedBrokerId) {
      setMessage("Select commissions for one broker.");
      return;
    }
    const res = await fetch("/api/admin/finance/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId: selectedBrokerId, commissionIds: selectedIds, notes }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(json.error ?? "Failed");
      return;
    }
    setSelected({});
    setNotes("");
    setMessage("Batch created.");
    void load();
  }

  async function transition(id: string, action: "approve" | "mark_paid" | "mark_failed" | "cancel") {
    setMessage(null);
    const res = await fetch(`/api/admin/finance/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setMessage(json.error ?? "Failed");
    else setMessage("Updated.");
    void load();
  }

  const brokerOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of pending) {
      if (c.broker) m.set(c.broker.id, c.broker.email);
    }
    return [...m.entries()];
  }, [pending]);

  return (
    <div className="mt-8 space-y-10">
      {message && <p className="text-sm text-slate-400">{message}</p>}
      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      <section>
        <h2 className="text-lg font-medium text-slate-200">Pending commissions (not in an open batch)</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-500">Broker</label>
            <select className="input-premium mt-1" value={brokerFilter} onChange={(e) => setBrokerFilter(e.target.value)}>
              <option value="">All</option>
              {brokerOptions.map(([id, email]) => (
                <option key={id} value={id}>
                  {email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-500">Notes (optional)</label>
            <input className="input-premium mt-1 w-full" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="button" className="btn-primary text-sm" onClick={() => void createBatch()}>
            Create payout batch
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-500">
              <tr>
                <th className="p-2"> </th>
                <th className="p-2">Broker</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Payment</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!!selected[c.id]}
                      disabled={!!selectedBrokerId && c.broker?.id !== selectedBrokerId}
                      onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))}
                    />
                  </td>
                  <td className="p-2 text-slate-300">{c.broker?.email ?? "—"}</td>
                  <td className="p-2">{fmt(c.brokerAmountCents)}</td>
                  <td className="p-2 text-slate-500">{c.payment.paymentType}</td>
                  <td className="p-2 text-slate-500">{c.payment.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPending.length === 0 && <p className="p-4 text-sm text-slate-500">No pending rows.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-200">Payout batches</h2>
        <div className="mt-4 space-y-4">
          {payouts.map((p) => (
            <div key={p.id} className="card-premium p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">
                    {p.broker.email} · {fmt(p.totalAmountCents)} {p.currency.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.status} · {p.payoutMethod} · {p.lines.length} lines · {p.createdAt.slice(0, 10)}
                  </p>
                  {p.approvedAt && <p className="text-xs text-slate-600">Approved {p.approvedAt.slice(0, 10)}</p>}
                  {p.paidAt && <p className="text-xs text-emerald-600/80">Paid {p.paidAt.slice(0, 10)}</p>}
                  {p.failureReason && <p className="text-xs text-rose-400">{p.failureReason}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "PENDING" && (
                    <>
                      <button type="button" className="btn-secondary text-xs" onClick={() => void transition(p.id, "approve")}>
                        Approve
                      </button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => void transition(p.id, "cancel")}>
                        Cancel
                      </button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => void transition(p.id, "mark_failed")}>
                        Mark failed
                      </button>
                    </>
                  )}
                  {p.status === "APPROVED" && (
                    <>
                      <button type="button" className="btn-primary text-xs" onClick={() => void transition(p.id, "mark_paid")}>
                        Mark paid (record only)
                      </button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => void transition(p.id, "cancel")}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {payouts.length === 0 && <p className="text-sm text-slate-500">No batches yet.</p>}
        </div>
        <a
          href="/api/admin/finance/export?format=csv&type=payouts"
          className="mt-6 inline-block text-sm text-amber-400 hover:text-amber-300"
        >
          Export payout history (CSV) →
        </a>
      </section>
    </div>
  );
}
