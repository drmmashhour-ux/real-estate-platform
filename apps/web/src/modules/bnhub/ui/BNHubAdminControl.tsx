"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  openDisputes: number;
  fraudAlerts: {
    id: string;
    message: string;
    severity: string;
    listing: { id: string; title: string; listingCode: string } | null;
  }[];
  highFraudListings: {
    fraudScore: number;
    listing: { id: string; title: string; listingCode: string; listingStatus: string };
  }[];
  pendingListingApprovals: number;
};

type DisputeRow = {
  id: string;
  status: string;
  description: string;
  bookingId: string;
  booking?: { guest?: { email?: string | null }; listing?: { title?: string } };
};

export function BNHubAdminControl() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveId, setResolveId] = useState("");
  const [resolveStatus, setResolveStatus] = useState("RESOLVED_PARTIAL_REFUND");
  const [refundCents, setRefundCents] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch("/api/bnhub/admin/control-summary", { credentials: "include" }),
        fetch("/api/bnhub/disputes", { credentials: "include" }),
      ]);
      if (sRes.ok) setSummary((await sRes.json()) as Summary);
      if (dRes.ok) setDisputes((await dRes.json()) as DisputeRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runResolve() {
    if (!resolveId.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bnhub/admin/disputes/${encodeURIComponent(resolveId.trim())}/resolve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: resolveStatus,
          refundCents: refundCents ? Number(refundCents) : undefined,
          resolutionNotes: notes || undefined,
        }),
      });
      if (res.ok) {
        setResolveId("");
        setRefundCents("");
        setNotes("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">BNHub</p>
        <h1 className="text-2xl font-semibold">Trust & safety control</h1>
        <p className="mt-1 text-sm text-slate-400">
          Fraud alerts, disputes, trust monitoring, and listing approval queue (read-only counts — use moderation for approvals).
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/admin/bnhub/moderation" className="text-emerald-400 hover:text-emerald-300">
            Listing moderation →
          </Link>
          <button type="button" onClick={() => void refresh()} className="text-slate-400 underline hover:text-slate-200">
            Refresh
          </button>
        </div>
      </header>

      {loading && !summary ? <p className="text-slate-500">Loading…</p> : null}

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">Open disputes</p>
            <p className="text-2xl font-semibold text-amber-200">{summary.openDisputes}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">Pending approvals</p>
            <p className="text-2xl font-semibold text-slate-100">{summary.pendingListingApprovals}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">High fraud listings (score ≥ 60)</p>
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-slate-300">
              {summary.highFraudListings.length === 0 ? <li>None flagged.</li> : null}
              {summary.highFraudListings.map((h) => (
                <li key={h.listing.id}>
                  <Link href={`/bnhub/${h.listing.id}`} className="text-emerald-400 hover:underline">
                    {h.listing.listingCode}
                  </Link>{" "}
                  · {h.fraudScore} — {h.listing.title.slice(0, 40)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {summary?.fraudAlerts?.length ? (
        <section className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <h2 className="text-sm font-semibold text-red-100">Fraud alerts (open)</h2>
          <ul className="mt-2 space-y-2 text-sm text-red-100/90">
            {summary.fraudAlerts.map((a) => (
              <li key={a.id} className="border-b border-red-900/30 pb-2 last:border-0">
                <span className="text-xs text-red-300/80">{a.severity}</span> — {a.message}
                {a.listing ? (
                  <Link href={`/bnhub/${a.listing.id}`} className="ml-2 text-emerald-400 hover:underline">
                    View listing
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold">Resolve dispute</h2>
        <p className="mt-1 text-xs text-slate-500">Applies refund flags and payout-hold updates per dispute policy.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">Dispute ID</span>
            <input
              value={resolveId}
              onChange={(e) => setResolveId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Status</span>
            <select
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="RESOLVED_PARTIAL_REFUND">Partial refund</option>
              <option value="RESOLVED_FULL_REFUND">Full refund</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESOLVED">Resolved (no refund)</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Refund (cents, optional)</span>
            <input
              value={refundCents}
              onChange={(e) => setRefundCents(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-400">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runResolve()}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Apply resolution"}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent disputes</h2>
        <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800">
          {disputes.slice(0, 40).map((d) => (
            <li key={d.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-xs text-slate-500">{d.id.slice(0, 8)}…</span>
                <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{d.status}</span>
                <p className="mt-1 text-slate-400">{d.description.slice(0, 120)}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/bnhub/booking/${d.bookingId}`} className="text-emerald-400 hover:underline">
                  Booking
                </Link>
                <button type="button" onClick={() => setResolveId(d.id)} className="text-slate-400 hover:text-slate-200">
                  Use ID
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
