"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  domain: string;
  title: string;
  summary: string;
  rationale: string;
  confidence: number | null;
  impactEstimate: number | null;
  status: string;
  requiresApproval: boolean;
  createdAt: string;
};

export function CeoDecisionsClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/ceo-ai/decisions", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; items?: Row[] };
      if (j.items) setItems(j.items);
      if (!j.ok) setErr("load_failed");
    } catch {
      setErr("load_failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, path: string) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/ceo-ai/decisions/${id}/${path}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!j.ok) setErr(j.error ?? path);
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {err ? <p className="text-xs text-rose-400">{err}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">Created</th>
              <th className="py-2 pr-2">Domain</th>
              <th className="py-2 pr-2">Title</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-white/5 align-top">
                <td className="py-2 pr-2 text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                <td className="py-2 pr-2 font-medium text-cyan-100/90">{row.domain}</td>
                <td className="py-2 pr-2 max-w-md">
                  <div className="text-slate-100">{row.title}</div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{row.summary}</p>
                </td>
                <td className="py-2 pr-2">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">{row.status}</span>
                </td>
                <td className="py-2 pr-2">
                  <div className="flex flex-wrap gap-1">
                    {row.status === "PROPOSED" ? (
                      <>
                        <button
                          type="button"
                          disabled={busy === row.id}
                          className="rounded bg-cyan-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-cyan-500 disabled:opacity-40"
                          onClick={() => void act(row.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy === row.id}
                          className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/5 disabled:opacity-40"
                          onClick={() => void act(row.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {row.status === "APPROVED" ? (
                      <button
                        type="button"
                        disabled={busy === row.id}
                        className="rounded bg-amber-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
                        onClick={() => void act(row.id, "execute")}
                      >
                        Execute
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ?
        <p className="py-8 text-center text-xs text-slate-500">No decisions yet — run a CEO cycle from Overview.</p>
      : null}
    </div>
  );
}
