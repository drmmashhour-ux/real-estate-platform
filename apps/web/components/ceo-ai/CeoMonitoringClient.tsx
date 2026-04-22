"use client";

import { useCallback, useEffect, useState } from "react";

type ExecRow = {
  id: string;
  domain: string;
  title: string;
  summary: string;
  confidence: number | null;
  impactEstimate: number | null;
  resultJson: unknown;
  executedAt: string | null;
  createdAt: string;
};

export function CeoMonitoringClient() {
  const [items, setItems] = useState<ExecRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/ceo-ai/monitoring", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; items?: ExecRow[]; summary?: { executed: number } };
      if (j.items) setItems(j.items);
      if (!j.ok) setErr("load_failed");
    } catch {
      setErr("load_failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function rollback(id: string) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/ceo-ai/decisions/${id}/rollback`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!j.ok) setErr(j.error ?? "rollback");
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {err ? <p className="text-xs text-rose-400">{err}</p> : null}
      <p className="text-xs text-slate-500">
        Executed decisions with outcome snapshots. Rollback reverses pricing when a prior base price was captured.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">Executed</th>
              <th className="py-2 pr-2">Domain</th>
              <th className="py-2 pr-2">Title</th>
              <th className="py-2 pr-2">Outcome hint</th>
              <th className="py-2 pr-2">Rollback</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const r = row.resultJson as { postConversion?: number; baselineConversion?: number } | null;
              const hint =
                r?.postConversion != null && r?.baselineConversion != null ?
                  `${(r.baselineConversion * 100).toFixed(1)}% → ${(r.postConversion * 100).toFixed(1)}% conv.`
                : "logged / queued";
              return (
                <tr key={row.id} className="border-b border-white/5 align-top">
                  <td className="py-2 pr-2 text-slate-500">
                    {row.executedAt ? new Date(row.executedAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-2 font-medium text-slate-200">{row.domain}</td>
                  <td className="py-2 pr-2 max-w-sm">
                    <div className="text-slate-100">{row.title}</div>
                    <p className="mt-1 text-[11px] text-slate-500">{row.summary}</p>
                  </td>
                  <td className="py-2 pr-2 text-slate-400">{hint}</td>
                  <td className="py-2 pr-2">
                    <button
                      type="button"
                      disabled={busy === row.id}
                      className="rounded border border-rose-500/40 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-950/40 disabled:opacity-40"
                      onClick={() => void rollback(row.id)}
                    >
                      Rollback
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 ?
        <p className="py-8 text-center text-xs text-slate-500">No executed CEO decisions yet.</p>
      : null}
    </div>
  );
}
