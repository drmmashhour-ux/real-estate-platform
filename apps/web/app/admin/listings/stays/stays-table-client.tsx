"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  listingStatus: string;
  verificationStatus: string;
  nightPriceCents: number;
  ownerId: string;
  bnhubListingTopHostBadge: boolean;
};

export function AdminStaysListingsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  async function run(action: "approve" | "reject" | "unlist" | "feature" | "unfeature") {
    const ids = [...selected];
    if (!ids.length) {
      setMsg("Select at least one listing.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/stays-listings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action, reason: "Bulk admin action" }),
      });
      const j = (await r.json()) as { updated?: number; errors?: string[] };
      if (!r.ok) {
        setMsg("Request failed.");
        return;
      }
      setMsg(`Updated ${j.updated ?? 0}. ${j.errors?.length ? j.errors.slice(0, 2).join(" ") : ""}`);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {msg ? <p className="text-sm text-slate-400">{msg}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("approve")}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
        >
          Approve selected
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("reject")}
          className="rounded-lg bg-rose-600/90 px-3 py-2 text-xs font-semibold text-white"
        >
          Reject selected
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("unlist")}
          className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white"
        >
          Pause selected
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("feature")}
          className="rounded-lg border border-amber-400/50 px-3 py-2 text-xs text-amber-200"
        >
          Feature selected
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("unfeature")}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-400"
        >
          Unfeature selected
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">
                <input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} />
              </th>
              <th className="p-3">Code</th>
              <th className="p-3">Title</th>
              <th className="p-3">City</th>
              <th className="p-3">Status</th>
              <th className="p-3">Verify</th>
              <th className="p-3">Price</th>
              <th className="p-3">Boost</th>
              <th className="p-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                </td>
                <td className="p-3 font-mono text-xs">{r.listingCode}</td>
                <td className="max-w-[200px] truncate p-3">{r.title}</td>
                <td className="p-3">{r.city}</td>
                <td className="p-3 text-xs">{r.listingStatus}</td>
                <td className="p-3 text-xs">{r.verificationStatus}</td>
                <td className="p-3">${(r.nightPriceCents / 100).toFixed(0)}</td>
                <td className="p-3 text-xs">{r.bnhubListingTopHostBadge ? "Yes" : "—"}</td>
                <td className="p-3">
                  <a
                    href={`/bnhub/host/listings/${r.id}/edit`}
                    className="text-premium-gold hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
