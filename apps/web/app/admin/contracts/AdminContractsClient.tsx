"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  type: string;
  title: string;
  status: string;
  signed: boolean;
  signedAt: string | null;
  version: string | null;
  userId: string;
  listingId: string | null;
  fsboListingId: string | null;
  bookingId: string | null;
  user: { email: string | null; name: string | null };
  createdAt: string;
};

export function AdminContractsClient() {
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const params = new URLSearchParams();
    if (type.trim()) params.set("type", type.trim());
    if (q.trim()) params.set("q", q.trim());
    const r = await fetch(`/api/admin/contracts?${params.toString()}`, { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(typeof j.error === "string" ? j.error : "Failed");
      return;
    }
    setRows(Array.isArray(j.data) ? j.data : []);
  }, [type, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Filter by type (contains)"
          className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search id / title"
          className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
        >
          Apply
        </button>
      </div>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[960px] text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 bg-black/40 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Listing / FSBO / booking</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No contracts.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-mono text-xs text-amber-200/90">{c.type}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate" title={c.title}>
                    {c.title || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="text-slate-300">{c.user.name || c.user.email || c.userId}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                    {c.listingId ? `st:${c.listingId.slice(0, 8)}…` : ""}
                    {c.fsboListingId ? ` fsbo:${c.fsboListingId.slice(0, 8)}…` : ""}
                    {c.bookingId ? ` bk:${c.bookingId.slice(0, 8)}…` : ""}
                    {!c.listingId && !c.fsboListingId && !c.bookingId ? "—" : ""}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded bg-white/10 px-2 py-0.5">{c.status}</span>
                    {c.signed ? <span className="ml-1 text-emerald-400">signed</span> : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="text-xs font-semibold text-premium-gold hover:underline"
                      >
                        View
                      </Link>
                      <a
                        href={`/api/contracts/${c.id}/download`}
                        className="text-xs font-semibold text-slate-400 hover:underline"
                      >
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
