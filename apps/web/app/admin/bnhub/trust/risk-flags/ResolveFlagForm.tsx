"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResolveFlagForm({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function run(action: "resolve" | "dismiss" | "escalate") {
    setPending(action);
    try {
      const res = await fetch(`/api/admin/bnhub/trust/risk-flags/${flagId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(typeof j.error === "string" ? j.error : "Request failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => run("resolve")}
        className="rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950/40"
      >
        {pending === "resolve" ? "…" : "Resolve"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => run("dismiss")}
        className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
      >
        {pending === "dismiss" ? "…" : "Dismiss"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => run("escalate")}
        className="rounded border border-amber-700/50 px-2 py-1 text-xs text-amber-200 hover:bg-amber-950/30"
      >
        {pending === "escalate" ? "…" : "Escalate"}
      </button>
    </div>
  );
}
