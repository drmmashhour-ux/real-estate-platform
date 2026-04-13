"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  message: string;
  createdAt: string;
  fsboListingId: string | null;
  listingId: string | null;
  listingCode: string | null;
};

export default function BuyerInquiriesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/buyer/my-inquiries", { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) {
          setErr("Sign in to see your inquiries.");
          setRows([]);
          return null;
        }
        return r.json();
      })
      .then((j) => {
        if (!j) return;
        setRows(Array.isArray(j.inquiries) ? j.inquiries : []);
      })
      .catch(() => {
        setErr("Could not load inquiries.");
        setRows([]);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Your inquiries</h1>
      <p className="mt-2 text-sm text-slate-400">
        Requests you submitted from BuyHub listing pages (CRM lead + FSBO trail).
      </p>

      {err && <p className="mt-6 text-sm text-amber-400">{err}</p>}

      {rows === null ? (
        <p className="mt-8 text-sm text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No inquiries yet.{" "}
          <Link href="/buy" className="text-premium-gold hover:underline">
            Browse listings
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-200"
            >
              <p className="text-xs text-slate-500">
                {new Date(r.createdAt).toLocaleString()}
                {r.listingCode ? (
                  <span className="ml-2 font-mono text-slate-400">· {r.listingCode}</span>
                ) : null}
              </p>
              <p className="mt-2 line-clamp-4 text-slate-300">{r.message}</p>
              {(r.fsboListingId || r.listingId) && (
                <Link
                  href={`/listings/${r.fsboListingId ?? r.listingId}`}
                  className="mt-3 inline-block text-xs font-medium text-premium-gold hover:underline"
                >
                  View listing →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
