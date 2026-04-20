"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  action: string;
  actorType: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export function LegalAuditTable({ admin }: { admin?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!admin) return;
    const res = await fetch("/api/legal/audit?limit=25", { credentials: "same-origin" });
    const data = (await res.json()) as { items?: Row[] };
    setRows(data.items ?? []);
  }, [admin]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!admin) return null;

  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-xs text-slate-300">
        <thead className="sticky top-0 border-b border-white/10 bg-black/80 text-[10px] uppercase text-slate-500">
          <tr>
            <th className="px-2 py-2">When</th>
            <th className="px-2 py-2">Action</th>
            <th className="px-2 py-2">Entity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-2 py-1.5 text-[10px] text-slate-500">{r.createdAt}</td>
              <td className="px-2 py-1.5">{r.action}</td>
              <td className="px-2 py-1.5 font-mono text-[10px]">
                {r.entityType}:{r.entityId.slice(0, 6)}…
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
