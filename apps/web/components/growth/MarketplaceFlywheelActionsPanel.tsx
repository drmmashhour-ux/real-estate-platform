"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";
import type { FlywheelActionStatus } from "@/modules/growth/flywheel-action.types";
import type { FlywheelActionWithLatestOutcome } from "@/modules/growth/flywheel-action.types";

const INSIGHT_LABEL: Record<MarketplaceFlywheelInsightType, string> = {
  broker_gap: "Broker gap",
  demand_gap: "Demand gap",
  supply_gap: "Supply gap",
  conversion_opportunity: "Conversion",
  pricing_opportunity: "Pricing",
};

export function MarketplaceFlywheelActionsPanel({
  insightsForPicker,
}: {
  insightsForPicker: Array<{ id: string; type: MarketplaceFlywheelInsightType }>;
}) {
  const [actions, setActions] = useState<FlywheelActionWithLatestOutcome[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pickInsightId, setPickInsightId] = useState("");
  const [pickInsightType, setPickInsightType] = useState<MarketplaceFlywheelInsightType>("broker_gap");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/marketplace-flywheel/actions", { credentials: "same-origin" });
    const data = (await res.json().catch(() => ({}))) as { actions?: FlywheelActionWithLatestOutcome[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not load actions.");
      return;
    }
    setActions(Array.isArray(data.actions) ? data.actions : []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createAction = async () => {
    setBusy("create");
    setError("");
    const res = await fetch("/api/admin/marketplace-flywheel/actions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        insightId: pickInsightId.trim(),
        insightType: pickInsightType,
        note: note.trim() || undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Create failed.");
      setBusy(null);
      return;
    }
    setOpen(false);
    setNote("");
    await load();
    setBusy(null);
  };

  const patchStatus = async (id: string, status: FlywheelActionStatus) => {
    setBusy(id + status);
    const res = await fetch(`/api/admin/marketplace-flywheel/actions/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Update failed.");
      setBusy(null);
      return;
    }
    await load();
    setBusy(null);
  };

  return (
    <section className="mt-6 rounded-2xl border border-teal-500/25 bg-[#091416] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300/90">Tracking</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Flywheel actions</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Record what operators commit to against an insight — no auto-campaigns, ads, or payment changes.
          </p>
        </div>
        <button
          type="button"
          disabled={busy !== null}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          onClick={() => setOpen(true)}
        >
          Create action…
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">{error}</p>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">Type</th>
              <th className="py-2 pr-2">Insight</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Created</th>
              <th className="py-2">Operator note</th>
            </tr>
          </thead>
          <tbody>
            {actions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  No tracked actions yet.
                </td>
              </tr>
            ) : (
              actions.map((a) => (
                <tr key={a.id} className="border-b border-white/5 align-top">
                  <td className="py-3 pr-2 font-mono text-[11px] text-teal-100">{a.type}</td>
                  <td className="py-3 pr-2">
                    <span className="text-slate-400">{INSIGHT_LABEL[a.insightType]}</span>
                    <span className="mt-1 block truncate font-mono text-[10px] text-slate-600" title={a.insightId}>
                      {a.insightId.slice(0, 24)}…
                    </span>
                  </td>
                  <td className="py-3 pr-2">
                    <select
                      className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-white"
                      value={a.status}
                      disabled={busy !== null}
                      onChange={(e) => void patchStatus(a.id, e.target.value as FlywheelActionStatus)}
                    >
                      {(["proposed", "acknowledged", "in_progress", "completed", "abandoned"] as const).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-2 tabular-nums text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 max-w-[200px] truncate text-slate-500">{a.note ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1818] p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-white">Create flywheel action</h4>
            <p className="mt-2 text-xs text-slate-400">
              Links this operator commitment to the current insight id + type (baseline snapshot captured server-side).
            </p>
            <label className="mt-4 block text-xs font-medium text-slate-400">
              Insight type
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                value={pickInsightType}
                onChange={(e) => setPickInsightType(e.target.value as MarketplaceFlywheelInsightType)}
              >
                {(Object.keys(INSIGHT_LABEL) as MarketplaceFlywheelInsightType[]).map((k) => (
                  <option key={k} value={k}>
                    {INSIGHT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-xs font-medium text-slate-400">
              Insight id (copy from card — exact match)
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                value={pickInsightId}
                onChange={(e) => setPickInsightId(e.target.value)}
              >
                <option value="">Select matching insight…</option>
                {insightsForPicker
                  .filter((i) => i.type === pickInsightType)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.id.slice(0, 48)}…
                    </option>
                  ))}
              </select>
            </label>
            <label className="mt-4 block text-xs font-medium text-slate-400">
              Note (optional)
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null || !pickInsightId.trim()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                onClick={() => void createAction()}
              >
                {busy === "create" ? "Saving…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
