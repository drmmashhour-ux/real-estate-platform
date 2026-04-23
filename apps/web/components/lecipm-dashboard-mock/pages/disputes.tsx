"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";

import { MockBadge, MockButton, MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

type DisputeRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  relatedEntityType: string;
  relatedEntityId: string;
  updatedAt: string;
  openedBy?: { name?: string | null; email?: string | null };
  againstUser?: { name?: string | null; email?: string | null };
};

function statusTone(s: string): Parameters<typeof MockBadge>[0]["tone"] {
  switch (s) {
    case "OPEN":
      return "dispute-open";
    case "IN_REVIEW":
      return "dispute-review";
    case "ESCALATED":
      return "dispute-escalated";
    case "RESOLVED":
      return "dispute-resolved";
    case "REJECTED":
      return "dispute-rejected";
    default:
      return "muted";
  }
}

export function DisputesRoomPage() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (status) q.set("status", status);
      if (priority) q.set("priority", priority);
      if (category) q.set("category", category);
      const res = await fetch(`/api/disputes/list?${q.toString()}`, { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { disputes?: DisputeRow[]; error?: string };
      if (!res.ok) {
        setError(j?.error ?? "load_failed");
        setRows([]);
        return;
      }
      setRows(j.disputes ?? []);
    } catch {
      setError("network_error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, priority, category]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredNote = useMemo(() => {
    if (rows.length === 0 && !loading && !error) {
      return "No disputes yet — open one from a booking, deal, or listing when signed in.";
    }
    return null;
  }, [rows.length, loading, error]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Operations</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Dispute Room</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ds-text-secondary">
          Neutral resolution workspace — tied to live LECIPM entities. Facilitative only; not legal findings.
        </p>
      </div>

      <MockCard>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft-gold">Filters</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <FilterSelect label="Status" value={status} onChange={setStatus} options={["", "OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED", "REJECTED"]} />
          <FilterSelect
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={["", "LOW", "MEDIUM", "HIGH"]}
          />
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={["", "NO_SHOW", "PAYMENT", "MISLEADING_LISTING", "OTHER"]}
          />
          <MockButton variant="ghost" className="!py-2 !text-xs" onClick={() => void load()}>
            Refresh
          </MockButton>
        </div>
      </MockCard>

      {error ?
        <p className="rounded-xl border border-red-500/35 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {error === "Unauthorized" ? "Sign in to load disputes." : error}
        </p>
      : null}
      {loading ?
        <p className="text-sm text-ds-text-secondary">Loading disputes…</p>
      : null}
      {filteredNote ?
        <p className="text-sm text-ds-text-secondary">{filteredNote}</p>
      : null}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((d) => (
          <Link key={d.id} href={`/design/lecipm-dashboard/disputes/${d.id}`} className="block">
            <MockCard
              glow={d.priority === "HIGH" || d.status === "ESCALATED"}
              className="h-full cursor-pointer transition hover:border-ds-gold/40 hover:shadow-[0_0_32px_rgba(212,175,55,0.12)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-secondary">
                    {d.relatedEntityType} · {d.relatedEntityId.slice(0, 8)}…
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{d.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MockBadge tone={statusTone(d.status)}>{d.status}</MockBadge>
                  <MockBadge tone={d.priority === "HIGH" ? "gold" : "muted"}>{d.priority}</MockBadge>
                </div>
              </div>
              <p className="mt-3 text-xs text-ds-text-secondary">
                Last activity · {new Date(d.updatedAt).toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-ds-text-secondary">
                Parties · {d.openedBy?.name ?? d.openedBy?.email ?? "opener"} vs{" "}
                {d.againstUser?.name ?? d.againstUser?.email ?? "—"}
              </p>
            </MockCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterSelect(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-ds-text-secondary">
      {label}
      <select
        className="rounded-lg border border-ds-border bg-black/50 px-3 py-2 text-sm text-white"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o || "all"} value={o}>
            {o || "All"}
          </option>
        ))}
      </select>
    </label>
  );
}
