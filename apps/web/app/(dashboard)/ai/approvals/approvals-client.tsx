"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "#D4AF37";

type Row = {
  id: string;
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  createdAt: string;
  requesterId: string;
};

export function ApprovalsClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(id);
    await fetch("/api/ai/actions/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(null);
    router.refresh();
  }

  async function reject(id: string) {
    setBusy(id);
    await fetch("/api/ai/actions/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, note: "rejected" }),
    });
    setBusy(null);
    router.refresh();
  }

  if (initial.length === 0) {
    return <p className="text-sm text-white/45">No pending approvals.</p>;
  }

  return (
    <ul className="space-y-3">
      {initial.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-white">{r.actionKey}</p>
            <p className="text-xs text-white/45">
              {r.targetEntityType} / {r.targetEntityId.slice(0, 10)}…
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy === r.id}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
              style={{ backgroundColor: GOLD }}
              onClick={() => void approve(r.id)}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy === r.id}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-40"
              onClick={() => void reject(r.id)}
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
