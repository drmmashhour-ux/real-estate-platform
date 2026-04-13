"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AutopilotBar = {
  suggestedActions: number;
  followUpsDueToday: number;
};

type LeadRow = {
  id: string;
  displayName: string;
  status: string;
  source: string;
  priorityLabel: string;
  priorityScore: number;
  listing: { id: string; title: string; listingCode: string } | null;
  lastActivityAt: string;
  nextFollowUpAt: string | null;
};

type Kpis = {
  newLeads: number;
  highPriority: number;
  followUpsDueToday: number;
  closedThisWeek: number;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "high", label: "High priority" },
  { id: "followup_due", label: "Follow-up due" },
  { id: "closed", label: "Closed" },
  { id: "lost", label: "Lost" },
] as const;

function badgePriority(label: string) {
  if (label === "high") return "bg-rose-500/20 text-rose-100";
  if (label === "medium") return "bg-amber-500/20 text-amber-100";
  return "bg-slate-500/20 text-slate-200";
}

function badgeStatus(status: string) {
  if (status === "new") return "bg-sky-500/20 text-sky-100";
  if (status === "closed" || status === "lost") return "bg-slate-600/40 text-slate-200";
  return "bg-emerald-500/15 text-emerald-100";
}

export function BrokerCrmHomeClient() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [view, setView] = useState<"table" | "pipeline">("table");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autopilotBar, setAutopilotBar] = useState<AutopilotBar | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/broker-crm/leads?filter=${encodeURIComponent(filter)}`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as { leads?: LeadRow[]; kpis?: Kpis; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setLeads(Array.isArray(j.leads) ? j.leads : []);
      setKpis(j.kpis ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/broker-autopilot/summary", { credentials: "same-origin" });
        const j = (await res.json()) as Partial<AutopilotBar> & { error?: string };
        if (!res.ok || cancelled) return;
        setAutopilotBar({
          suggestedActions: j.suggestedActions ?? 0,
          followUpsDueToday: j.followUpsDueToday ?? 0,
        });
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pipelineGroups: Record<string, LeadRow[]> = {
    new: leads.filter((l) => l.status === "new"),
    active: leads.filter((l) => !["closed", "lost"].includes(l.status)),
    won: leads.filter((l) => l.status === "closed"),
    lost: leads.filter((l) => l.status === "lost"),
  };

  return (
    <div className="space-y-6">
      {autopilotBar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
          <div className="flex flex-wrap gap-4 text-sm text-slate-200">
            <span>
              <span className="text-slate-500">Suggested actions</span>{" "}
              <span className="font-semibold text-amber-100">{autopilotBar.suggestedActions}</span>
            </span>
            <span>
              <span className="text-slate-500">Follow-ups due today</span>{" "}
              <span className="font-semibold text-amber-100">{autopilotBar.followUpsDueToday}</span>
            </span>
          </div>
          <Link
            href="/dashboard/crm/autopilot"
            className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
          >
            Open Autopilot
          </Link>
        </div>
      ) : null}
      {kpis ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "New leads", value: kpis.newLeads },
            { label: "High-priority", value: kpis.highPriority },
            { label: "Follow-ups due today", value: kpis.followUpsDueToday },
            { label: "Closed this week", value: kpis.closedThisWeek },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{c.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === f.id ? "bg-premium-gold text-black" : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-lg px-3 py-1.5 text-xs ${view === "table" ? "bg-white/15 text-white" : "text-slate-400"}`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setView("pipeline")}
            className={`rounded-lg px-3 py-1.5 text-xs ${view === "pipeline" ? "bg-white/15 text-white" : "text-slate-400"}`}
          >
            Pipeline
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {!loading && view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-white/5 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Last activity</th>
                <th className="px-3 py-2">Next follow-up</th>
                <th className="px-3 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((row) => {
                const overdue =
                  row.nextFollowUpAt && new Date(row.nextFollowUpAt) < new Date() && !["closed", "lost"].includes(row.status);
                return (
                  <tr key={row.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-3 py-2">
                      <Link href={`/dashboard/crm/${row.id}`} className="font-medium text-premium-gold hover:underline">
                        {row.displayName}
                      </Link>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-slate-400">
                      {row.listing?.title ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${badgeStatus(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${badgePriority(row.priorityLabel)}`}>
                        {row.priorityLabel} ({row.priorityScore})
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                      {new Date(row.lastActivityAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {row.nextFollowUpAt ? (
                        <span className={overdue ? "font-semibold text-amber-300" : "text-slate-400"}>
                          {new Date(row.nextFollowUpAt).toLocaleString()}
                          {overdue ? " · overdue" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{row.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && view === "pipeline" ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "new", title: "New" },
            { key: "active", title: "In progress" },
            { key: "won", title: "Closed" },
            { key: "lost", title: "Lost" },
          ].map((col) => (
            <div key={col.key} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">{col.title}</p>
              <ul className="mt-2 space-y-2">
                {pipelineGroups[col.key as keyof typeof pipelineGroups]?.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/dashboard/crm/${l.id}`}
                      className="block rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white hover:border-premium-gold/40"
                    >
                      <span className="line-clamp-2">{l.displayName}</span>
                      <span className="mt-1 block text-[10px] text-slate-500">{l.listing?.title ?? "No listing"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
