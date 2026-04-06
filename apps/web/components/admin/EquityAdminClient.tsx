"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EQUITY_ROLES } from "@/src/modules/equity/constants";

type HolderOpt = { id: string; name: string; role: string };

export function EquityAdminClient({ holders }: { holders: HolderOpt[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function post(url: string, body?: object) {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
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
    <div className="space-y-6">
      {err ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</p>
      ) : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Add holder</h3>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void post("/api/admin/equity/holders", {
              name: fd.get("name"),
              role: fd.get("role"),
            });
            e.currentTarget.reset();
          }}
        >
          <input name="name" required placeholder="Name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <select name="role" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            {EQUITY_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            Create
          </button>
        </form>
      </div>

      {holders.length > 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold text-white">Create grant</h3>
          <form
            className="mt-3 grid gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void post("/api/admin/equity/grants", {
                holderId: fd.get("holderId"),
                totalShares: Number(fd.get("shares")),
                vestingStart: fd.get("start"),
                vestingDuration: Number(fd.get("duration")),
                cliffMonths: Number(fd.get("cliff")),
              });
              e.currentTarget.reset();
            }}
          >
            <select name="holderId" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm sm:col-span-2">
              {holders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.role})
                </option>
              ))}
            </select>
            <input name="shares" type="number" min={1} step={1} required placeholder="Total shares" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input name="start" type="date" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input name="duration" type="number" min={1} placeholder="Vesting months (e.g. 48)" defaultValue={48} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <input name="cliff" type="number" min={0} placeholder="Cliff months (e.g. 12)" defaultValue={12} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
            <button type="submit" disabled={busy} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50 sm:col-span-2">
              Save grant
            </button>
          </form>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void post("/api/admin/equity/recalculate")}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          Recalculate vesting (today)
        </button>
        <a
          href="/api/admin/equity/export?format=csv"
          className="inline-flex items-center rounded-lg border border-amber-800/60 px-4 py-2 text-sm text-amber-200/90 hover:bg-amber-950/40"
        >
          Export CSV
        </a>
        <a
          href="/api/admin/equity/export?format=json"
          className="inline-flex items-center rounded-lg border border-amber-800/60 px-4 py-2 text-sm text-amber-200/90 hover:bg-amber-950/40"
        >
          Export JSON
        </a>
      </div>
    </div>
  );
}
