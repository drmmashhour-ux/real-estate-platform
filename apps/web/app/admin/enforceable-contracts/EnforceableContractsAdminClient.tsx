"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  type: string;
  title: string;
  version: string | null;
  signed: boolean;
  signedAt: string | null;
  signerIpAddress: string | null;
  userId: string;
  listingId: string | null;
  fsboListingId: string | null;
  createdAt: string;
};

export function EnforceableContractsAdminClient() {
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState("");
  const [listingId, setListingId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (userId.trim()) p.set("userId", userId.trim());
    if (listingId.trim()) p.set("listingId", listingId.trim());
    const r = await fetch(`/api/admin/enforceable-contracts?${p.toString()}`, { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(typeof j.error === "string" ? j.error : "Failed");
      return;
    }
    setRows(Array.isArray(j.data) ? j.data : []);
  }, [q, userId, listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title / id"
          className="min-w-[160px] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User id"
          className="min-w-[200px] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <input
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          placeholder="Listing id"
          className="min-w-[200px] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black"
        >
          Search
        </button>
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/40">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Contract</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Signed</th>
              <th className="px-3 py-2">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No rows.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/80">
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-100">{r.title || r.type}</p>
                    <p className="font-mono text-[10px] text-slate-500">{r.id}</p>
                    <p className="text-[10px] text-slate-500">{r.type}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">{r.userId}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">
                    {r.fsboListingId ?? r.listingId ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.signedAt ? new Date(r.signedAt).toLocaleString() : "—"}
                    {r.signerIpAddress ? (
                      <span className="block text-[10px] text-slate-500">IP {r.signerIpAddress}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/api/contracts/${encodeURIComponent(r.id)}/download`}
                      className="text-[#C9A646] hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </Link>
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
