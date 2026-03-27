"use client";

import { useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  listingCode: string | null;
  title: string;
  city: string;
  priceCents: number;
  status: string;
  moderationStatus: string;
  ownerId: string;
  rejectReason: string | null;
  sellerDeclarationCompletedAt: Date | null;
  riskScore: number | null;
  trustScore: number | null;
  _count: { leads: number };
};

export function AdminFsboClient({ listings }: { listings: Row[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [minRisk, setMinRisk] = useState<number | "">("");

  async function moderate(id: string, action: "approve" | "reject") {
    const reason =
      action === "reject"
        ? window.prompt("Rejection reason (optional, shown to owner in dashboard context)?") ?? ""
        : "";
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/fsbo/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(typeof d.error === "string" ? d.error : "Failed");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  const filtered =
    minRisk === "" ? listings : listings.filter((l) => (l.riskScore ?? 0) >= Number(minRisk));

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <label className="flex items-center gap-2">
          <span>Risk score ≥</span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="70"
            value={minRisk === "" ? "" : minRisk}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") setMinRisk("");
              else {
                const n = Number.parseInt(v, 10);
                setMinRisk(Number.isFinite(n) ? n : 0);
              }
            }}
            className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
          />
        </label>
        <span className="text-xs text-slate-500">
          Rows with risk &gt; 70 are highlighted. Showing {filtered.length} of {listings.length}.
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Listing</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Status</th>
              <th className="p-3">Mod</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Trust</th>
              <th className="p-3">Declaration</th>
              <th className="p-3">Leads</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr
                key={l.id}
                className={`border-t border-slate-800 ${(l.riskScore ?? 0) > 70 ? "bg-red-950/40" : ""}`}
              >
                <td className="p-3">
                  <div className="font-mono text-xs text-slate-400">{l.listingCode ?? "—"}</div>
                  <div className="mt-1 font-medium text-white">{l.title}</div>
                  <div className="text-xs text-slate-500">
                    {l.city} · ${(l.priceCents / 100).toLocaleString()}
                  </div>
                  {l.rejectReason ? (
                    <div className="mt-1 text-xs text-rose-400">Reject: {l.rejectReason}</div>
                  ) : null}
                </td>
                <td className="p-3 font-mono text-xs">{l.ownerId.slice(0, 8)}…</td>
                <td className="p-3">{l.status}</td>
                <td className="p-3">{l.moderationStatus}</td>
                <td className="p-3 font-mono text-xs">
                  {l.riskScore != null ? (
                    <span className={(l.riskScore ?? 0) > 70 ? "text-red-300" : "text-slate-300"}>{l.riskScore}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 font-mono text-xs">{l.trustScore != null ? l.trustScore : "—"}</td>
                <td className="p-3 text-xs">
                  {l.sellerDeclarationCompletedAt ? (
                    <span className="text-emerald-400">Complete</span>
                  ) : (
                    <span className="text-amber-300">Incomplete</span>
                  )}
                </td>
                <td className="p-3">{l._count.leads}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/fsbo/${l.id}/edit`} className="text-xs text-sky-400 hover:underline">
                      Edit
                    </Link>
                    <Link href={`/sell/${l.id}`} className="text-xs text-amber-400 hover:underline">
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={busy === l.id}
                      onClick={() => void moderate(l.id, "approve")}
                      className="text-xs font-semibold text-emerald-400 hover:underline disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy === l.id}
                      onClick={() => void moderate(l.id, "reject")}
                      className="text-xs font-semibold text-rose-400 hover:underline disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
