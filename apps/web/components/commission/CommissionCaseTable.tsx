"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  status: string;
  grossCommissionCents: number;
  deal: { dealCode: string | null } | null;
};

export function CommissionCaseTable() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/broker/office/commissions", { credentials: "include" });
      const j = (await r.json()) as { cases?: Row[]; error?: string };
      if (!r.ok) {
        if (!cancelled) setErr(j.error ?? "Failed to load");
        return;
      }
      if (!cancelled) setRows(j.cases ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!rows) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No commission cases yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-900/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2">Deal</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Gross (¢)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.03]">
              <td className="px-4 py-2 font-mono text-xs text-zinc-300">{c.deal?.dealCode ?? c.id.slice(0, 8)}</td>
              <td className="px-4 py-2 text-amber-200/90">{c.status}</td>
              <td className="px-4 py-2 tabular-nums text-zinc-300">{c.grossCommissionCents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
