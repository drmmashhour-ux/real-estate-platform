"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  status: string;
  platform: string;
  lastSyncAt: string | null;
  lastError: string | null;
  user: { email: string | null; name: string | null };
  mappings: { listing: { id: string; title: string } }[];
  syncLogs: { status: string; message: string | null; createdAt: string }[];
};

export function AdminChannelManagerClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/bnhub/channel-manager")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setRows(d.connections ?? []);
      })
      .catch(() => setErr("Failed to load"));
  }, []);

  async function disable(id: string) {
    await fetch(`/api/admin/bnhub/channel-manager/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" }),
    });
    const r = await fetch("/api/admin/bnhub/channel-manager");
    const d = await r.json();
    setRows(d.connections ?? []);
  }

  if (err) return <p className="text-red-400">{err}</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Host</th>
            <th className="px-4 py-3">Listing</th>
            <th className="px-4 py-3">Platform</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last sync</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-slate-800/80">
              <td className="px-4 py-3 text-slate-300">{c.user?.email ?? c.user?.name ?? "—"}</td>
              <td className="px-4 py-3 text-slate-400">
                {c.mappings?.map((m) => m.listing?.title).filter(Boolean).join(", ") || "—"}
              </td>
              <td className="px-4 py-3">{c.platform}</td>
              <td className="px-4 py-3">
                <span className={c.status === "ERROR" ? "text-red-400" : "text-slate-300"}>{c.status}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => void disable(c.id)}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  Pause
                </button>
                {c.lastError && <p className="mt-1 max-w-xs text-xs text-red-400">{c.lastError}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-6 text-slate-500">No connections yet.</p>}
    </div>
  );
}
