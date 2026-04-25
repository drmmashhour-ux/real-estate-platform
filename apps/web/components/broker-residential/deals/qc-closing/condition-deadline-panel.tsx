"use client";

import { useEffect, useState } from "react";
import type { QcClosingApiBundle } from "./qc-closing-types";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rowsFromConditions(conditions: QcClosingApiBundle["conditions"]) {
  const m: Record<string, { id?: string; deadline: string; status: string; notes: string }> = {};
  for (const c of conditions) {
    m[c.conditionType] = {
      id: c.id,
      deadline: toLocalInput(c.deadline),
      status: c.status,
      notes: c.notes ?? "",
    };
  }
  return m;
}

export function ConditionDeadlinePanel({
  dealId,
  bundle,
  onUpdated,
}: {
  dealId: string;
  bundle: QcClosingApiBundle;
  onUpdated: (b: QcClosingApiBundle) => void;
}) {
  const [rows, setRows] = useState(() => rowsFromConditions(bundle.conditions));

  useEffect(() => {
    setRows(rowsFromConditions(bundle.conditions));
  }, [bundle.conditions]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setErr(null);
    setLoading(true);
    try {
      const items = Object.entries(rows).map(([conditionType, v]) => ({
        id: v.id,
        conditionType,
        deadline: v.deadline ? new Date(v.deadline).toISOString() : "",
        status: v.status,
        notes: v.notes || null,
      }));
      const res = await fetch(`/api/deals/${dealId}/closing/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onUpdated(data as QcClosingApiBundle);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <p className="text-xs text-ds-text-secondary">
        Every condition must have an explicit deadline. Status: pending, fulfilled, waived, failed — timestamps are stored on save.
      </p>
      <ul className="space-y-2">
        {bundle.conditions.map((c) => (
          <li key={c.id} className="rounded-lg border border-white/5 bg-black/25 px-3 py-2 text-xs">
            <div className="font-medium text-ds-text">{c.conditionType.replaceAll("_", " ")}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="text-ds-text-secondary">
                Deadline
                <input
                  type="datetime-local"
                  className="mt-0.5 w-full rounded border border-ds-border bg-black/30 px-2 py-1 text-ds-text"
                  value={rows[c.conditionType]?.deadline ?? ""}
                  onChange={(e) =>
                    setRows((r) => ({
                      ...r,
                      [c.conditionType]: { ...r[c.conditionType], id: c.id, deadline: e.target.value, status: r[c.conditionType]?.status ?? c.status, notes: r[c.conditionType]?.notes ?? "" },
                    }))
                  }
                />
              </label>
              <label className="text-ds-text-secondary">
                Status
                <select
                  className="mt-0.5 w-full rounded border border-ds-border bg-black/40 px-2 py-1 text-ds-text"
                  value={rows[c.conditionType]?.status ?? c.status}
                  onChange={(e) =>
                    setRows((r) => ({
                      ...r,
                      [c.conditionType]: {
                        ...r[c.conditionType],
                        id: c.id,
                        deadline: r[c.conditionType]?.deadline ?? toLocalInput(c.deadline),
                        status: e.target.value,
                        notes: r[c.conditionType]?.notes ?? "",
                      },
                    }))
                  }
                >
                  <option value="pending">pending</option>
                  <option value="fulfilled">fulfilled</option>
                  <option value="waived">waived</option>
                  <option value="failed">failed</option>
                </select>
              </label>
              <label className="text-ds-text-secondary sm:col-span-1">
                Notes
                <input
                  className="mt-0.5 w-full rounded border border-ds-border bg-black/30 px-2 py-1 text-ds-text"
                  value={rows[c.conditionType]?.notes ?? ""}
                  onChange={(e) =>
                    setRows((r) => ({
                      ...r,
                      [c.conditionType]: {
                        ...r[c.conditionType],
                        id: c.id,
                        deadline: r[c.conditionType]?.deadline ?? toLocalInput(c.deadline),
                        status: r[c.conditionType]?.status ?? c.status,
                        notes: e.target.value,
                      },
                    }))
                  }
                />
              </label>
            </div>
            <p className="mt-1 text-[10px] text-ds-text-secondary/80">
              Fulfilled {c.fulfilledAt?.slice(0, 10) ?? "—"} · Waived {c.waivedAt?.slice(0, 10) ?? "—"} · Failed{" "}
              {c.failedAt?.slice(0, 10) ?? "—"}
            </p>
          </li>
        ))}
      </ul>
      {bundle.conditions.length === 0 ? <p className="text-xs text-ds-text-secondary">No conditions yet — open the closing room to seed defaults.</p> : null}
      <button
        type="button"
        disabled={loading || bundle.conditions.length === 0 || !bundle.closing}
        className="rounded-lg border border-ds-gold/40 px-3 py-1.5 text-xs font-semibold text-ds-gold disabled:opacity-40"
        onClick={() => void save()}
      >
        Save conditions
      </button>
    </div>
  );
}
