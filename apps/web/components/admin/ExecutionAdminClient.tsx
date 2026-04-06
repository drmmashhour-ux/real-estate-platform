"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExecutionAdminClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function post(kind: string, extra: Record<string, unknown> = {}) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/execution/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void post("message", { count: 1 })}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          +1 message
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void post("broker", { count: 1 })}
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          +1 broker
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void post("booking", { count: 1 })}
          className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          +1 booking
        </button>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const amount = Number(fd.get("amount"));
          if (!Number.isFinite(amount) || amount <= 0) {
            setErr("Enter a positive revenue amount");
            return;
          }
          void post("revenue", { amount });
          e.currentTarget.reset();
        }}
      >
        <label className="text-xs text-slate-500">
          Log revenue ($)
          <input
            name="amount"
            type="number"
            min={0.01}
            step={0.01}
            className="ml-2 w-32 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-600 disabled:opacity-50"
        >
          Add revenue
        </button>
      </form>
    </div>
  );
}
