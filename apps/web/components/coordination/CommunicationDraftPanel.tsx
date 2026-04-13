"use client";

import { useEffect, useState } from "react";

export function CommunicationDraftPanel({ dealId, onError }: { dealId: string; onError: (e: string | null) => void }) {
  const [rows, setRows] = useState<{ id: string; channel: string; subject: string | null; body: string | null }[]>([]);

  useEffect(() => {
    fetch(`/api/deals/${encodeURIComponent(dealId)}/communications`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) onError(j.error);
        else setRows(Array.isArray(j.communications) ? j.communications : []);
      })
      .catch(() => onError("Communications load failed"));
  }, [dealId, onError]);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-lg font-medium text-slate-100">Communication drafts / logs</h2>
      <ul className="mt-2 space-y-2 text-sm text-slate-400">
        {rows.map((c) => (
          <li key={c.id} className="rounded border border-slate-800/80 p-2">
            <p className="text-xs text-slate-500">{c.channel}</p>
            {c.subject ? <p className="text-slate-200">{c.subject}</p> : null}
            {c.body ? <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{c.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
