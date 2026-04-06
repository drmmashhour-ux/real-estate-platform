"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SalesTeamAdminClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function postJson(url: string, body?: object) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</p>
      ) : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Add sales agent</h3>
        <p className="mt-1 text-xs text-slate-500">Uses existing platform `User.id` (UUID).</p>
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void postJson("/api/admin/sales/agents", {
              userId: fd.get("userId"),
              role: fd.get("role") || "agent",
              priority: Number(fd.get("priority") || 0),
            });
            e.currentTarget.reset();
          }}
        >
          <input
            name="userId"
            required
            placeholder="User UUID"
            className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs"
          />
          <input
            name="role"
            placeholder="role (agent)"
            className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <input
            name="priority"
            type="number"
            placeholder="priority"
            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Create agent
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Auto-assign pool</h3>
        <p className="mt-1 text-xs text-slate-500">
          Round-robin (fair load) or priority (weight then load). Targets leads with no assignment yet.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void postJson("/api/admin/sales/assign-batch", { limit: 25, mode: "round_robin" })}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Assign 25 (round-robin)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void postJson("/api/admin/sales/assign-batch", { limit: 25, mode: "priority" })}
            className="rounded-lg bg-violet-800 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Assign 25 (priority)
          </button>
        </div>
      </div>
    </div>
  );
}
