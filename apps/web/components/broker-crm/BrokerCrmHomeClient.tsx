"use client";

import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BROKER_CRM_KANBAN_COLUMNS,
  brokerCrmStatusToKanbanColumn,
  KANBAN_COLUMN_LABEL,
  type BrokerCrmKanbanColumn,
} from "@/modules/crm/crm.types";

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
  /** Rule-based label (internal scoring; no auto-messaging). */
  aiScoreLabel?: string;
  suggestedNext?: string | null;
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
  if (status === "contacted") return "bg-violet-500/15 text-violet-100";
  if (status === "qualified") return "bg-emerald-500/20 text-emerald-100";
  if (status === "visit_scheduled" || status === "negotiating") return "bg-amber-500/20 text-amber-100";
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
  const [convSummary, setConvSummary] = useState<{
    topOpportunities: LeadRow[];
    dealsAtRiskCount: number;
    highPotentialOpenCount: number;
    firstLeadEligible: boolean;
    unlockCount: number;
    coachTips: string[];
  } | null>(null);
  const homeViewTracked = useRef(false);

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
        const res = await fetch("/api/broker/conversion/summary", { credentials: "same-origin" });
        const j = (await res.json()) as Record<string, unknown>;
        if (!res.ok || cancelled) return;
        setConvSummary({
          topOpportunities: Array.isArray(j.topOpportunities) ? (j.topOpportunities as LeadRow[]) : [],
          dealsAtRiskCount: Number(j.dealsAtRiskCount ?? 0),
          highPotentialOpenCount: Number(j.highPotentialOpenCount ?? 0),
          firstLeadEligible: Boolean(j.firstLeadEligible),
          unlockCount: Number(j.unlockCount ?? 0),
          coachTips: Array.isArray(j.coachTips) ? (j.coachTips as string[]) : [],
        });
      } catch {
        if (!cancelled) setConvSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (homeViewTracked.current) return;
    homeViewTracked.current = true;
    void fetch("/api/broker/conversion/track", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "broker_conversion_crm_view" }),
    }).catch(() => {});
  }, []);

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

  const nextBest = useMemo(() => {
    if (!leads.length) return "Review your pipeline and pick one follow-up for today.";
    const hot = leads.find((l) => l.priorityLabel === "high" && !["closed", "lost"].includes(l.status));
    if (hot) return `Next: follow up with ${hot.displayName} (high priority).`;
    const due = leads.find(
      (l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && !["closed", "lost"].includes(l.status)
    );
    if (due) return `This deal needs follow-up: ${due.displayName}.`;
    return `Work the newest lead: ${leads[0]!.displayName}.`;
  }, [leads]);

  return (
    <div className="space-y-6">
      {convSummary ? (
        <div className="space-y-4">
          {convSummary.firstLeadEligible ? (
            <div className="rounded-xl border border-premium-gold/30 bg-gradient-to-r from-amber-950/40 to-black/50 px-4 py-4">
              <p className="text-sm font-semibold text-white">Try your first lead — see how it works</p>
              <p className="mt-1 text-sm text-slate-300">
                Here are your top opportunities right now. Value is visible before you pay — unlock is optional.
              </p>
            </div>
          ) : null}
          {convSummary.unlockCount >= 1 && convSummary.highPotentialOpenCount >= 2 ? (
            <div className="rounded-lg border border-slate-600/50 bg-white/5 px-4 py-3 text-sm text-slate-200">
              You have {convSummary.highPotentialOpenCount} more high-potential leads in your queue — pick the next
              best when you are ready.
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top actions today</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {convSummary.topOpportunities.length === 0 ? (
                  <li className="text-slate-500">No leads yet — inquiries will appear here.</li>
                ) : (
                  convSummary.topOpportunities.map((row) => (
                    <li key={row.id}>
                      <Link href={`/dashboard/crm/${row.id}`} className="text-premium-gold hover:underline">
                        {row.displayName}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {" "}
                        · {row.priorityLabel} ({row.priorityScore})
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/15 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-200/90">Deals at risk</h3>
              <p className="mt-2 text-2xl font-semibold text-white">{convSummary.dealsAtRiskCount}</p>
              <p className="mt-1 text-xs text-slate-400">Follow-ups overdue (excluding closed/lost).</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Next best action</h3>
              <p className="mt-2 text-sm text-slate-100">{nextBest}</p>
            </div>
          </div>
          {convSummary.coachTips.length ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
              {convSummary.coachTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
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
                      <span
                        className="rounded-full border border-violet-500/30 bg-violet-950/30 px-2 py-0.5 text-[11px] text-violet-100"
                        title="Rule-based score from message signals. Not legal or financial advice."
                      >
                        {row.aiScoreLabel ?? `${row.priorityLabel} · ${row.priorityScore}`}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-3 py-2 text-xs text-slate-400" title="Suggestions only; nothing is auto-sent.">
                      {row.suggestedNext ? row.suggestedNext : "—"}
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
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {BROKER_CRM_KANBAN_COLUMNS.map((colKey) => (
            <div
              key={colKey}
              className="min-w-[220px] shrink-0 rounded-xl border border-white/10 bg-black/25 p-3 lg:min-w-0"
            >
              <p className="text-xs font-semibold uppercase text-slate-500">{KANBAN_COLUMN_LABEL[colKey]}</p>
              <ul className="mt-2 space-y-2">
                {pipelineGroups[colKey].map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/dashboard/crm/${l.id}`}
                      className="block rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white hover:border-premium-gold/40"
                    >
                      <span className="line-clamp-2">{l.displayName}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {l.listing?.title ?? "No listing"} · {l.status}
                      </span>
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
