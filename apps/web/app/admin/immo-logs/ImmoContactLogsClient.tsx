"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatAuditDateTime } from "@/lib/format/audit-datetime";

type Row = {
  id: string;
  userId: string | null;
  listingId: string | null;
  listingKind: string | null;
  hub?: string | null;
  targetUserId?: string | null;
  brokerId?: string | null;
  contactType: string;
  eventType?: string;
  eventSlug?: string;
  metadata?: unknown;
  metadataJson?: unknown;
  createdAt: string;
  actionAt?: string;
  updatedAt?: string;
  adminNote?: string | null;
  adminNotedAt?: string | null;
  adminNotedById?: string | null;
};

function metaString(metadata: unknown, key: string): string {
  if (!metadata || typeof metadata !== "object") return "—";
  const v = (metadata as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v : "—";
}

type Props = {
  /** `timeline` groups events by day for audit review. */
  variant?: "table" | "timeline";
};

export function ImmoContactLogsClient({ variant = "table" }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [riskSummary, setRiskSummary] = useState<string | null>(null);
  const [filterListing, setFilterListing] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({ take: "200", order });
    if (filterListing.trim()) params.set("listingId", filterListing.trim());
    if (filterUser.trim()) params.set("userId", filterUser.trim());
    const r = await fetch(`/api/admin/immo-contact-logs?${params.toString()}`, { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(typeof j.error === "string" ? j.error : "Failed to load");
      return;
    }
    setRows(Array.isArray(j.data) ? j.data : []);
  }, [filterListing, filterUser, order]);

  const loadRisk = useCallback(async () => {
    const r = await fetch("/api/admin/legal/risk-summary", { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (r.ok && typeof j.summary === "string") {
      setRiskSummary(j.summary);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadRisk();
  }, [load, loadRisk]);

  const saveAdminNote = useCallback(
    async (id: string) => {
      const text = (noteDraft[id] ?? "").trim();
      if (!text) return;
      setSaving(id);
      try {
        const r = await fetch(`/api/admin/immo-contact-logs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ adminNote: text }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setError(typeof j.error === "string" ? j.error : "Save failed");
          return;
        }
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  adminNote: text,
                  adminNotedAt: new Date().toISOString(),
                }
              : row,
          ),
        );
        setNoteDraft((m) => {
          const n = { ...m };
          delete n[id];
          return n;
        });
      } finally {
        setSaving(null);
      }
    },
    [noteDraft],
  );

  const filtered = useMemo(() => {
    let r = rows;
    if (filterListing.trim()) {
      r = r.filter((x) => (x.listingId ?? "").includes(filterListing.trim()));
    }
    if (filterUser.trim()) {
      r = r.filter((x) => (x.userId ?? "").includes(filterUser.trim()));
    }
    return r;
  }, [rows, filterListing, filterUser]);

  const eventTime = (row: Row) => new Date(row.actionAt ?? row.createdAt).getTime();

  const sortedChronological = useMemo(() => {
    const dir = order === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => dir * (eventTime(a) - eventTime(b)));
  }, [filtered, order]);

  const byDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    const dayOrder: string[] = [];
    for (const row of sortedChronological) {
      const d = new Date(row.actionAt ?? row.createdAt).toDateString();
      if (!m.has(d)) {
        dayOrder.push(d);
        m.set(d, []);
      }
      m.get(d)!.push(row);
    }
    return dayOrder.map((d) => [d, m.get(d)!] as const);
  }, [sortedChronological]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <input
          value={filterListing}
          onChange={(e) => setFilterListing(e.target.value)}
          placeholder="Filter listing id"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
        />
        <input
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          placeholder="Filter user id"
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
        />
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value === "asc" ? "asc" : "desc")}
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
        >
          Refresh
        </button>
      </div>

      {riskSummary ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-premium-gold">24h legal risk snapshot</h2>
          <p className="mt-2 text-sm text-slate-300">{riskSummary}</p>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {variant === "timeline" ? (
        <div className="space-y-8">
          {byDay.length === 0 ? (
            <p className="text-slate-500">No events.</p>
          ) : (
            byDay.map(([day, dayRows]) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{day}</p>
                <ul className="relative mt-3 border-l border-slate-700 pl-6">
                  {dayRows.map((r) => (
                    <li key={r.id} className="relative mb-4 pl-0">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-premium-gold" />
                      <p className="text-xs text-slate-500">
                        {formatAuditDateTime(r.actionAt ?? r.createdAt, { showTimezone: true, relative: true })}
                      </p>
                      <p className="font-mono text-sm text-slate-200">{r.eventType ?? r.contactType}</p>
                      <p className="text-[11px] text-slate-500">
                        hub {metaString(r.metadata, "sourceHub")} · channel {metaString(r.metadata, "channel")} · listing{" "}
                        {r.listingId ?? "—"} · user {r.userId ?? "—"} · {r.listingKind ?? "—"}
                      </p>
                      {r.adminNote ? (
                        <p className="mt-1 text-[11px] text-amber-200/90">Admin note: {r.adminNote}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/40">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-slate-700 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Event time (local)</th>
                <th className="px-3 py-2">Event type</th>
                <th className="px-3 py-2">Hub</th>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Admin note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No events yet.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/80 align-top">
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {formatAuditDateTime(r.actionAt ?? r.createdAt, { showTimezone: true })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.eventType ?? r.contactType}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{metaString(r.metadata, "sourceHub")}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.listingId ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.listingKind ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.userId ?? "—"}</td>
                    <td className="px-3 py-2 max-w-[220px]">
                      {r.adminNote ? (
                        <p className="text-[11px] text-slate-400">{r.adminNote}</p>
                      ) : null}
                      <textarea
                        value={noteDraft[r.id] ?? ""}
                        onChange={(e) => setNoteDraft((m) => ({ ...m, [r.id]: e.target.value }))}
                        placeholder="Add admin note…"
                        rows={2}
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-[11px] text-slate-200"
                      />
                      <button
                        type="button"
                        disabled={saving === r.id || !(noteDraft[r.id] ?? "").trim()}
                        onClick={() => void saveAdminNote(r.id)}
                        className="mt-1 rounded bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200 disabled:opacity-40"
                      >
                        {saving === r.id ? "Saving…" : "Save note"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
