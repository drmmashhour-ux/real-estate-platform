"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  listingId: string | null;
  listingCode: string | null;
  createdAt: string;
  firstPlatformContactAt: string | null;
  commissionEligible: boolean;
  commissionSource: string | null;
  userId: string | null;
  introducedByBrokerId: string | null;
  deal: {
    id: string;
    status: string;
    possibleBypassFlag: boolean;
    commissionSource: string | null;
  } | null;
  introducedByBroker: { id: string; name: string | null; email: string } | null;
};

export function ImmoContactsAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [dealId, setDealId] = useState("");
  const [leadIdInput, setLeadIdInput] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const r = await fetch("/api/admin/immocontacts", { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(typeof j.error === "string" ? j.error : "Failed to load");
      return;
    }
    setRows(Array.isArray(j.leads) ? j.leads : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const linkDeal = async () => {
    const d = dealId.trim();
    const l = leadIdInput.trim();
    if (!d) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/deals/${encodeURIComponent(d)}/lead-link`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: l || null }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(typeof j.error === "string" ? j.error : "Failed");
        return;
      }
      setDealId("");
      setLeadIdInput("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">ImmoContact leads</h1>
        <p className="mt-2 text-sm text-slate-400">
          Platform-originated contacts — traceability, commission source, and deal linkage. Use the tool below to attach
          or clear a deal link when resolving disputes.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-[#C9A646]">Manual deal ↔ lead link</h2>
        <p className="mt-1 text-xs text-slate-500">Paste deal UUID and lead UUID (empty lead = unlink).</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            placeholder="Deal ID"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            value={leadIdInput}
            onChange={(e) => setLeadIdInput(e.target.value)}
            placeholder="Lead ID (optional)"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void linkDeal()}
            className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-[#0B0B0B] disabled:opacity-50"
          >
            {busy ? "…" : "Apply"}
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">ImmoContact</th>
              <th className="px-3 py-2">First contact</th>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Broker</th>
              <th className="px-3 py-2">Deal</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No ImmoContact leads yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/80">
                  <td className="px-3 py-2">
                    <span className="rounded bg-[#C9A646]/20 px-2 py-0.5 font-semibold text-[#E8D5A3]">ImmoContact</span>
                    <div className="mt-1 font-mono text-[10px] text-slate-500">{r.id.slice(0, 12)}…</div>
                    <div className="text-slate-400">{r.name}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                    {(r.firstPlatformContactAt ?? r.createdAt)
                      ? new Date(r.firstPlatformContactAt ?? r.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.listingCode ? (
                      <span className="font-mono text-[#C9A646]">{r.listingCode}</span>
                    ) : (
                      <span className="font-mono text-slate-500">{r.listingId?.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {r.introducedByBroker?.name ?? r.introducedByBroker?.email ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {r.deal ? (
                      <div>
                        <Link href={`/dashboard/deals/${r.deal.id}`} className="text-[#C9A646] hover:underline">
                          {r.deal.id.slice(0, 8)}…
                        </Link>
                        <div className="text-slate-500">{r.deal.status}</div>
                        {r.deal.possibleBypassFlag ? (
                          <span className="text-amber-400">Possible bypass</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
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
