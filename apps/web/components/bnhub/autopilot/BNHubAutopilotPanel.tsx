"use client";

import { useCallback, useEffect, useState } from "react";
import type { BNHubAutopilotAction, BNHubAutopilotActionType } from "@/modules/bnhub/autopilot/bnhub-autopilot.types";

const AUTO_EXEC_TYPES = new Set<BNHubAutopilotActionType>(["IMPROVE_TITLE", "IMPROVE_DESCRIPTION", "ADD_AMENITIES"]);

function payloadSummary(action: BNHubAutopilotAction): string {
  const p = action.payload;
  switch (p.kind) {
    case "title":
      return p.proposedTitle.slice(0, 120) + (p.proposedTitle.length > 120 ? "…" : "");
    case "description":
      return p.proposedDescription.slice(0, 140) + (p.proposedDescription.length > 140 ? "…" : "");
    case "amenities":
      return p.appendAmenities.join(", ");
    case "photo_suggestion":
      return p.checklist.join(" · ");
    case "trust":
      return p.steps.join(" · ");
    case "pricing":
      return p.note;
    default:
      return "";
  }
}

export function BNHubAutopilotPanel({
  listingId,
  autopilotV1,
  executionV1,
  rollbackV1,
}: {
  listingId: string;
  autopilotV1: boolean;
  executionV1: boolean;
  rollbackV1: boolean;
}) {
  const [actions, setActions] = useState<BNHubAutopilotAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!autopilotV1 || !listingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bnhub/autopilot/actions?listingId=${encodeURIComponent(listingId)}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { actions?: BNHubAutopilotAction[]; error?: string };
      if (!res.ok) {
        setError(data.error === "feature_off" ? "Autopilot is disabled." : res.statusText || "Failed to load");
        setActions([]);
        return;
      }
      setActions(Array.isArray(data.actions) ? data.actions : []);
    } catch {
      setError("Network error");
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [autopilotV1, listingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err =
        typeof data === "object" && data && "error" in data
          ? String((data as { error?: string }).error)
          : res.statusText;
      throw new Error(err || "Request failed");
    }
    return data;
  };

  const withBusy = async (id: string | null, fn: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  };

  if (!autopilotV1) return null;

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-premium-gold/90">Safe autopilot</p>
          <p className="text-[11px] text-neutral-500">
            Approve before changes. Title, description, and amenities can be applied and rolled back. Pricing stays
            suggestion-only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!busyId || loading}
            onClick={() =>
              withBusy(null, async () => {
                await run("/api/bnhub/autopilot/generate", { listingId });
              })
            }
            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-200 hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Generate actions"}
          </button>
          {executionV1 ? (
            <button
              type="button"
              disabled={!!busyId || loading}
              onClick={() =>
                withBusy(null, async () => {
                  await run("/api/bnhub/autopilot/execute", { batch: true, listingId });
                })
              }
              className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50"
            >
              Execute approved (safe)
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-amber-400/90">{error}</p> : null}

      {actions.length === 0 && !loading ? (
        <p className="mt-3 text-xs text-neutral-600">No actions yet. Generate to pull suggestions from mission control.</p>
      ) : null}

      <ul className="mt-3 space-y-3">
        {actions.map((a) => {
          const canExec = a.status === "approved" && AUTO_EXEC_TYPES.has(a.type) && executionV1;
          const canRollback = a.status === "executed" && a.reversible && rollbackV1 && AUTO_EXEC_TYPES.has(a.type);
          const isBusy = busyId === a.id;

          return (
            <li key={a.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-white">{a.type.replace(/_/g, " ")}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
                    {a.status}
                    {a.impact ? ` · ${a.impact} impact` : ""}
                  </p>
                </div>
                <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
                  {a.id.slice(0, 14)}…
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-400">{a.why}</p>
              <p className="mt-1 text-[11px] text-neutral-500">{payloadSummary(a)}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {a.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() =>
                        withBusy(a.id, async () => {
                          await run("/api/bnhub/autopilot/approve", { actionId: a.id });
                        })
                      }
                      className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-100 disabled:opacity-50"
                    >
                      {isBusy ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busyId}
                      onClick={() =>
                        withBusy(a.id, async () => {
                          await run("/api/bnhub/autopilot/reject", { actionId: a.id });
                        })
                      }
                      className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {canExec ? (
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() =>
                      withBusy(a.id, async () => {
                        await run("/api/bnhub/autopilot/execute", { actionId: a.id });
                      })
                    }
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-100 disabled:opacity-50"
                  >
                    {isBusy ? "…" : "Execute"}
                  </button>
                ) : null}

                {a.status === "approved" && !canExec ? (
                  <span className="text-[11px] text-neutral-600">
                    {AUTO_EXEC_TYPES.has(a.type)
                      ? !executionV1
                        ? "Execution flag off"
                        : "Cannot execute"
                      : "Suggestion only — approve to track; no auto-apply"}
                  </span>
                ) : null}

                {canRollback ? (
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() =>
                      withBusy(a.id, async () => {
                        await run("/api/bnhub/autopilot/rollback", { actionId: a.id });
                      })
                    }
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-100 disabled:opacity-50"
                  >
                    {isBusy ? "…" : "Rollback"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
