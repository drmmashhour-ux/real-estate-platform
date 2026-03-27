"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  listingId: string;
  listingTitle: string | null;
  status: string;
  offeredPrice: number;
  downPaymentAmount: number | null;
  financingNeeded: boolean | null;
  closingDate: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: { name: string | null; email: string | null };
};

export default function BrokerOffersInboxPage() {
  const [offers, setOffers] = useState<Row[]>([]);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams();
    if (status !== "all") q.set("status", status);
    q.set("sort", sort);
    void fetch(`/api/broker/offers?${q.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; offers?: Row[]; error?: string }) => {
        if (cancelled) return;
        if (!j.ok) {
          setErr(j.error ?? "Could not load");
          return;
        }
        setOffers(j.offers ?? []);
      })
      .catch(() => {
        if (!cancelled) setErr("Network error");
      });
    return () => {
      cancelled = true;
    };
  }, [status, sort]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-white">Offer inbox</h1>
        <p className="mt-1 text-sm text-slate-400">Review incoming offers — filters, sort, and open detail to act.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="COUNTERED">Countered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_desc">Price high → low</option>
            <option value="price_asc">Price low → high</option>
          </select>
        </div>

        {err ? <p className="mt-4 text-sm text-red-300">{err}</p> : null}

        {offers.length === 0 && !err ? (
          <p className="mt-8 text-slate-500">No offers in this view.</p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {offers.map((o) => (
              <li
                key={o.id}
                className="flex flex-col rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm shadow-black/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {o.listingTitle ?? o.listingId.slice(0, 12) + "…"}
                    </p>
                    <p className="font-mono text-[10px] text-slate-600">{o.listingId}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-amber-500/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200/90">
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold text-[#C9A96E]">${o.offeredPrice.toLocaleString()}</p>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Buyer</dt>
                    <dd className="truncate text-slate-200">{o.buyer.name ?? "—"}</dd>
                    <dd className="truncate text-slate-500">{o.buyer.email}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Financing</dt>
                    <dd className="text-slate-200">
                      {o.financingNeeded == null ? "—" : o.financingNeeded ? "Yes" : "No"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Closing</dt>
                    <dd className="text-slate-200">
                      {o.closingDate ? new Date(o.closingDate).toLocaleDateString() : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Submitted</dt>
                    <dd className="text-slate-200">{new Date(o.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>

                {o.message ? (
                  <p className="mt-3 line-clamp-3 border-t border-white/5 pt-3 text-xs text-slate-300">{o.message}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/offers/${o.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#C9A96E]/90 px-3 py-2 text-center text-xs font-semibold text-black hover:bg-[#C9A96E]"
                  >
                    Review &amp; act
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
