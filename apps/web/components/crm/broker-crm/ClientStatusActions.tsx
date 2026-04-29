"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrokerClientStatus } from "@/types/broker-crm-client";
import { getAllowedBrokerClientStatusTransitions } from "@/modules/crm/services/client-status-machine";

function label(s: BrokerClientStatus): string {
  return s.replace(/_/g, " ");
}

export function ClientStatusActions({
  clientId,
  current,
}: {
  clientId: string;
  current: BrokerClientStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const allowed = getAllowedBrokerClientStatusTransitions(current);

  async function move(to: BrokerClientStatus) {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/broker/clients/${clientId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status: to, message: note.trim() || undefined }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setErr(j.error ?? "Could not update status");
      return;
    }
    setNote("");
    router.refresh();
  }

  if (allowed.length === 0) {
    return <p className="text-sm text-slate-500">No further moves from this stage.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => move(s)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/10 disabled:opacity-50"
          >
            → {label(s)}
          </button>
        ))}
      </div>
      <label className="block text-xs text-slate-500">
        Optional note with status change
        <textarea
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={20000}
        />
      </label>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
    </div>
  );
}
