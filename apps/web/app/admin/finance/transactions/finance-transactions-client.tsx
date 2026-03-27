"use client";

import { useCallback, useEffect, useState } from "react";

type BrokerOption = { id: string; email: string; name: string | null };

type Row = {
  id: string;
  userId: string;
  listingId: string | null;
  bookingId: string | null;
  dealId: string | null;
  paymentType: string;
  amountCents: number;
  currency: string;
  status: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeFeeCents: number | null;
  refundedAmountCents: number | null;
  metadata?: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; name: string | null };
  brokerCommissions: {
    brokerAmountCents: number;
    platformAmountCents: number;
    brokerId: string | null;
    broker: { id: string; email: string; name: string | null } | null;
  }[];
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function FinanceTransactionsClient({ brokers }: { brokers: BrokerOption[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [userId, setUserId] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [listingId, setListingId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [dealId, setDealId] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ data: Row[]; total: number; hasMore: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const sp = new URLSearchParams();
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);
    if (status) sp.set("status", status);
    if (paymentType) sp.set("paymentType", paymentType);
    if (userId.trim()) sp.set("userId", userId.trim());
    if (brokerId) sp.set("brokerId", brokerId);
    if (listingId.trim()) sp.set("listingId", listingId.trim());
    if (bookingId.trim()) sp.set("bookingId", bookingId.trim());
    if (dealId.trim()) sp.set("dealId", dealId.trim());
    if (q.trim()) sp.set("q", q.trim());
    sp.set("page", String(page));
    sp.set("limit", "40");
    const res = await fetch(`/api/admin/finance/transactions?${sp.toString()}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(json.error ?? "Failed to load");
      setData(null);
    } else {
      setData(json);
    }
    setLoading(false);
  }, [dateFrom, dateTo, status, paymentType, userId, brokerId, listingId, bookingId, dealId, q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mt-8 space-y-6">
      <div className="card-premium grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs text-slate-500">Date from</label>
          <input type="date" className="input-premium mt-1 w-full" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500">Date to</label>
          <input type="date" className="input-premium mt-1 w-full" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500">Status</label>
          <select className="input-premium mt-1 w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="paid">paid</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Payment type</label>
          <input
            className="input-premium mt-1 w-full"
            placeholder="booking, subscription…"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Broker</label>
          <select className="input-premium mt-1 w-full" value={brokerId} onChange={(e) => setBrokerId(e.target.value)}>
            <option value="">Any</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">User ID</label>
          <input className="input-premium mt-1 w-full" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Listing / booking / deal</label>
          <div className="mt-1 flex flex-col gap-1">
            <input className="input-premium w-full text-xs" placeholder="listingId" value={listingId} onChange={(e) => setListingId(e.target.value)} />
            <input className="input-premium w-full text-xs" placeholder="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
            <input className="input-premium w-full text-xs" placeholder="dealId" value={dealId} onChange={(e) => setDealId(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500">Search user</label>
          <input className="input-premium mt-1 w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email / name" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-sm" onClick={() => { setPage(1); void load(); }}>
          Apply filters
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
          Prev
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={() => setPage((p) => p + 1)} disabled={loading || !data?.hasMore}>
          Next
        </button>
        {data && (
          <span className="self-center text-xs text-slate-500">
            Page {page} · {data.total} total
          </span>
        )}
      </div>
      {err && <p className="text-sm text-rose-400">{err}</p>}
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && data && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-500">
              <tr>
                <th className="p-2">Created</th>
                <th className="p-2">Type</th>
                <th className="p-2">Gross</th>
                <th className="p-2">Platform</th>
                <th className="p-2">Broker</th>
                <th className="p-2">Stripe fee</th>
                <th className="p-2">Refund</th>
                <th className="p-2">Status</th>
                <th className="p-2">User</th>
                <th className="p-2">Refs</th>
                <th className="p-2">BNHub / Connect</th>
                <th className="p-2">PI</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => {
                const plat = r.brokerCommissions.reduce((s, c) => s + c.platformAmountCents, 0);
                const brok = r.brokerCommissions.reduce((s, c) => s + c.brokerAmountCents, 0);
                const brokerLabel = r.brokerCommissions.map((c) => c.broker?.email ?? c.brokerId ?? "—").join(", ");
                const meta =
                  r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata)
                    ? (r.metadata as Record<string, unknown>)
                    : null;
                const appFeeRaw = meta?.applicationFeeCents;
                const appFee =
                  typeof appFeeRaw === "string" ? parseInt(appFeeRaw, 10) : typeof appFeeRaw === "number" ? appFeeRaw : NaN;
                const connectDest = typeof meta?.connectDestination === "string" ? meta.connectDestination : null;
                return (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="p-2 whitespace-nowrap">{r.createdAt.slice(0, 19)}</td>
                    <td className="p-2">{r.paymentType}</td>
                    <td className="p-2">{fmt(r.amountCents)}</td>
                    <td className="p-2">{fmt(plat)}</td>
                    <td className="p-2" title={brokerLabel}>
                      {brok ? fmt(brok) : "—"}
                    </td>
                    <td className="p-2">{r.stripeFeeCents != null ? fmt(r.stripeFeeCents) : "—"}</td>
                    <td className="p-2">{r.refundedAmountCents ? fmt(r.refundedAmountCents) : "—"}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2 max-w-[140px] truncate" title={r.user.email}>
                      {r.user.email}
                    </td>
                    <td className="p-2 text-[10px] text-slate-500">
                      {r.listingId && <div>L:{r.listingId.slice(0, 6)}…</div>}
                      {r.bookingId && <div>B:{r.bookingId.slice(0, 6)}…</div>}
                      {r.dealId && <div>D:{r.dealId.slice(0, 6)}…</div>}
                      {!r.listingId && !r.bookingId && !r.dealId && "—"}
                    </td>
                    <td className="p-2 text-[10px] text-slate-500 max-w-[120px]">
                      {r.paymentType === "booking" && Number.isFinite(appFee) ? (
                        <>
                          <div>Fee: {fmt(appFee)}</div>
                          {connectDest ? (
                            <div className="truncate font-mono" title={connectDest}>
                              {connectDest.slice(0, 14)}…
                            </div>
                          ) : (
                            <div>—</div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 font-mono text-[10px] text-slate-500 max-w-[100px] truncate" title={r.stripePaymentIntentId ?? ""}>
                      {r.stripePaymentIntentId?.slice(0, 12) ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
