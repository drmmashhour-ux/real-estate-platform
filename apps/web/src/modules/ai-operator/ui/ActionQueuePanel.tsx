"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionApprovalModal, type QueueActionRow } from "@/src/modules/ai-operator/ui/ActionApprovalModal";

export function ActionQueuePanel() {
  const [rows, setRows] = useState<QueueActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueActionRow | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lecipm/ai-operator/actions?take=40");
      const data = await res.json();
      setRows((data.actions ?? []) as QueueActionRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener("lecipm-ai-operator-refresh", onRefresh);
    return () => window.removeEventListener("lecipm-ai-operator-refresh", onRefresh);
  }, [load]);

  const openRows = rows.filter((r) => ["pending", "suggested", "approved"].includes(r.status));

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Action queue</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs text-premium-gold hover:underline"
        >
          Refresh
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Explainable suggestions — approve before execution.</p>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading…</p> : null}
      {!loading && openRows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No open actions. Triggers fire from analysis, CRM, and conversion events.</p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {openRows.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => {
                setSelected(a);
                setOpen(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#0B0B0B]/80 px-3 py-2 text-left text-sm text-slate-200 hover:border-premium-gold/40"
            >
              <span className="font-medium text-white">{a.title}</span>
              <span className="ml-2 text-[10px] uppercase text-slate-500">{a.status}</span>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.reason}</p>
            </button>
          </li>
        ))}
      </ul>

      <ActionApprovalModal
        action={selected}
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        onAfterChange={() => void load()}
      />
    </section>
  );
}
