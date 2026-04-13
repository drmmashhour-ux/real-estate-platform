"use client";

import { useState, useTransition } from "react";
import { adminRefreshLeadCrmSignals } from "./actions";

export function LeadAiRefreshButton({ leadId }: { leadId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await adminRefreshLeadCrmSignals(leadId);
            setMsg(r.ok ? "Updated" : r.error ?? "Error");
          });
        }}
        className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
      >
        {pending ? "…" : "Re-score"}
      </button>
      {msg ? <span className="text-[10px] text-slate-500">{msg}</span> : null}
    </div>
  );
}
