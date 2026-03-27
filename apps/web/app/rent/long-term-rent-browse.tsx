"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  listingCode: string;
  title: string;
  priceMonthly: number;
  depositAmount: number;
  address: string;
  city: string | null;
  status: string;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function ListingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.04] p-5">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />
          <div className="mt-3 h-4 w-full rounded bg-white/5" />
          <div className="mt-6 flex gap-4">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LongTermRentBrowse() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        try {
          const url = q.trim()
            ? `/api/rental/listings?q=${encodeURIComponent(q.trim())}`
            : "/api/rental/listings";
          const r = await fetch(url, { credentials: "same-origin" });
          const j = (await r.json()) as { listings?: Row[]; error?: string };
          if (!r.ok) throw new Error(j.error ?? "failed");
          if (!cancelled) setRows(j.listings ?? []);
        } catch {
          if (!cancelled) setErr("Something went wrong. Please try again.");
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <section className="border-t border-white/10 bg-[#080808] py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Long-term rentals</h2>
            <p className="mt-1 text-sm text-[#888]">
              Apply online, sign a structured lease, and track rent — full lifecycle on-platform.
            </p>
          </div>
          <Link
            href="/dashboard/landlord"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            Landlord dashboard
          </Link>
        </div>

        <div className="mt-8">
          <input
            type="search"
            placeholder="Search by city, address, or code…"
            className="w-full max-w-md rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/35"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {err ? <p className="mt-6 text-sm text-amber-200/90">{err}</p> : null}

        <div className="mt-8">
          {rows === null ? (
            <ListingSkeleton />
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-[#888]">
              No listings match your search. Try another city or code, or publish a listing from the landlord dashboard.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((l) => (
                <Link
                  key={l.id}
                  href={`/rent/${l.id}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#C9A646]/40 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#C9A646]/90">
                      Code: {l.listingCode}
                    </p>
                    {l.status === "RENTED" ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                        Leased
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">
                        Open
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-[#C9A646]">{l.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[#888]">{l.address}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <span className="text-white/80">
                      <span className="text-white/50">Rent </span>
                      {money(l.priceMonthly)}
                    </span>
                    <span className="text-white/80">
                      <span className="text-white/50">Deposit </span>
                      {money(l.depositAmount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
