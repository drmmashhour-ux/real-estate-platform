"use client";

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
  /** 0–1 normalized priority score. */
  aiScore01?: number;
  /** hot / warm / cold from priority bands. */
  aiThermal?: "hot" | "warm" | "cold";
  suggestedNext?: string | null;
};

type Kpis = {
  newLeads: number;
  highPriority: number;
  followUpsDueToday: number;
  closedThisWeek: number;
};

type CrmInsightsPayload = {
  pipeline: {
    openLeads: number;
    stuckFollowUps: number;
    newLeads: number;
    highPriority: number;
  };
  operational?: {
    stalledLeads: number;
    overdueFollowUps?: number;
    uncontactedLeads: number;
    highScoreIgnoredLeads: number;
    dealBottlenecks: number;
  };
  suggestedBacklog: number;
  notes: string[];
  generatedAt: string;
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

function badgeThermal(t: string | undefined) {
  if (t === "hot") return "bg-rose-600/30 text-rose-50";
  if (t === "warm") return "bg-amber-500/25 text-amber-50";
  return "bg-slate-600/35 text-slate-200";
}

function leadEligibleForConvert(l: LeadRow): boolean {
  if (["closed", "lost"].includes(l.status)) return false;
  if (!l.listing?.id) return false;
  if (["qualified", "visit_scheduled", "negotiating"].includes(l.status)) return true;
  if (l.priorityLabel === "high") return true;
  return l.status === "contacted" && (l.priorityLabel === "medium" || l.priorityLabel === "high");
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
  const [crmInsights, setCrmInsights] = useState<CrmInsightsPayload | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [convertHintByLead, setConvertHintByLead] = useState<Record<string, string>>({});
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
        const res = await fetch("/api/crm/insights", { credentials: "same-origin" });
        const j = (await res.json()) as { ok?: boolean; insights?: CrmInsightsPayload };
        if (!res.ok || cancelled || !j.insights) return;
        setCrmInsights(j.insights);
      } catch {
        if (!cancelled) setCrmInsights(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const convertLeadToDeal = useCallback(async (leadId: string) => {
    setConvertingLeadId(leadId);
    setConvertHintByLead((prev) => {
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
    try {
      const res = await fetch("/api/crm/convert-to-deal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const j = (await res.json()) as { ok?: boolean; dealId?: string; reason?: string; error?: string };
      if (j.ok && j.dealId) {
        setConvertHintByLead((prev) => ({ ...prev, [leadId]: `Deal created — open in Deals (${j.dealId.slice(0, 8)}…).` }));
        await load();
      } else {
        setConvertHintByLead((prev) => ({
          ...prev,
          [leadId]: j.reason ?? j.error ?? "Conversion not available for this lead (see requirements).",
        }));
      }
    } catch {
      setConvertHintByLead((prev) => ({ ...prev, [leadId]: "Network error — try again." }));
    } finally {
      setConvertingLeadId(null);
    }
  }, [load]);

  const autopilotSuggestedLead = useMemo(() => {
    const withHint = leads.find((l) => l.suggestedNext && !["closed", "lost"].includes(l.status));
    if (withHint) return withHint;
    const hot = leads.find((l) => (l.aiThermal === "hot" || l.priorityLabel === "high") && !["closed", "lost"].includes(l.status));
    return hot ?? null;
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
                    <li key={row.id} className="flex flex-wrap items-center gap-1">
                      <Link href={`/dashboard/crm/${row.id}`} className="text-premium-gold hover:underline">
                        {row.displayName}
                      </Link>
                      {row.aiThermal ? (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase ${badgeThermal(row.aiThermal)}`}>
                          {row.aiThermal}
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-500">
                        · {row.aiScore01 != null ? `${(row.aiScore01 * 100).toFixed(0)}%` : `${row.priorityLabel} (${row.priorityScore})`}
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

      {autopilotSuggestedLead ? (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 px-4 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-200">AI Broker Autopilot — suggested focus</h3>
          <p className="mt-2 text-sm text-slate-200">
            <Link href={`/dashboard/crm/${autopilotSuggestedLead.id}`} className="font-medium text-premium-gold hover:underline">
              {autopilotSuggestedLead.displayName}
            </Link>
            <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${badgeThermal(autopilotSuggestedLead.aiThermal)}`}>
              {autopilotSuggestedLead.aiThermal ?? autopilotSuggestedLead.priorityLabel} ·{" "}
              {autopilotSuggestedLead.aiScore01 != null
                ? `${(autopilotSuggestedLead.aiScore01 * 100).toFixed(0)}%`
                : autopilotSuggestedLead.priorityScore}
            </span>
          </p>
          {autopilotSuggestedLead.suggestedNext ? (
            <p className="mt-2 text-sm text-slate-300">{autopilotSuggestedLead.suggestedNext}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Open the lead to run full evaluation (score + playbook-memory). Nothing is auto-sent.</p>
          )}
          <p className="mt-2 text-[10px] text-slate-500">
            Safe mode: prioritization &amp; tagging only — use{" "}
            <code className="text-slate-400">POST /api/broker-crm/leads/[id]/evaluate</code> from the lead workspace when needed.
          </p>
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

      {crmInsights ? (
        <section className="rounded-xl border border-sky-500/25 bg-sky-950/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-sky-100">CRM insights</h3>
            <p className="text-[10px] text-slate-500">
              <code className="text-slate-400">GET /api/crm/insights</code> · assistive only
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Open leads</p>
              <p className="text-lg font-semibold text-white">{crmInsights.pipeline.openLeads}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Stuck follow-ups (2d+)</p>
              <p className="text-lg font-semibold text-amber-100">{crmInsights.pipeline.stuckFollowUps}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Playbook suggestions backlog</p>
              <p className="text-lg font-semibold text-violet-100">{crmInsights.suggestedBacklog}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Generated</p>
              <p className="text-xs text-slate-400">{new Date(crmInsights.generatedAt).toLocaleString()}</p>
            </div>
          </div>
          {crmInsights.operational ? (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 text-sm">
              <div>
                <p className="text-xs text-slate-500">Stalled leads</p>
                <p className="text-lg font-semibold text-amber-100">{crmInsights.operational.stalledLeads}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Overdue follow-ups</p>
                <p className="text-lg font-semibold text-red-200/90">
                  {crmInsights.operational.overdueFollowUps ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Uncontacted / new</p>
                <p className="text-lg font-semibold text-sky-100">{crmInsights.operational.uncontactedLeads}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Warm/hot ignored</p>
                <p className="text-lg font-semibold text-rose-100">{crmInsights.operational.highScoreIgnoredLeads}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deal bottlenecks</p>
                <p className="text-lg font-semibold text-orange-100">{crmInsights.operational.dealBottlenecks}</p>
              </div>
            </div>
          ) : null}
          {crmInsights.notes.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-400">
              {crmInsights.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
        </section>
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
                <th className="px-3 py-2">AI / score</th>
                <th className="px-3 py-2">Suggestion</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Last activity</th>
                <th className="px-3 py-2">Next follow-up</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Deal</th>
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
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${badgeThermal(row.aiThermal)}`}
                          title="Thermal band from rule-based score (not legal advice)."
                        >
                          {row.aiThermal ?? "—"}
                        </span>
                        <span
                          className="rounded-full border border-violet-500/30 bg-violet-950/30 px-2 py-0.5 text-[11px] text-violet-100"
                          title="Rule-based score from message signals. Not legal or financial advice."
                        >
                          {row.aiScore01 != null ? `${(row.aiScore01 * 100).toFixed(0)}%` : row.aiScoreLabel ?? `${row.priorityScore}`}
                        </span>
                      </div>
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
                    <td className="px-3 py-2 text-xs">
                      {leadEligibleForConvert(row) ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            disabled={convertingLeadId === row.id}
                            onClick={() => void convertLeadToDeal(row.id)}
                            className="rounded-md border border-premium-gold/40 bg-premium-gold/10 px-2 py-1 text-[10px] font-semibold text-premium-gold hover:bg-premium-gold/20 disabled:opacity-50"
                          >
                            {convertingLeadId === row.id ? "…" : "Convert"}
                          </button>
                          {convertHintByLead[row.id] ? (
                            <p className="max-w-[140px] text-[9px] text-slate-500">{convertHintByLead[row.id]}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
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
                    <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white">
                      <Link href={`/dashboard/crm/${l.id}`} className="block hover:text-premium-gold">
                        <span className="line-clamp-2">{l.displayName}</span>
                      </Link>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        <span>{l.listing?.title ?? "No listing"} · {l.status}</span>
                        {l.aiThermal ? (
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase ${badgeThermal(l.aiThermal)}`}>
                            {l.aiThermal}
                          </span>
                        ) : null}
                        <span>
                          {l.aiScore01 != null ? `${(l.aiScore01 * 100).toFixed(0)}%` : l.aiScoreLabel ?? `${l.priorityScore}`}
                        </span>
                      </span>
                      {l.suggestedNext ? (
                        <p className="mt-1 line-clamp-2 text-[10px] text-violet-200/90" title="Suggestion only — nothing auto-sent.">
                          {l.suggestedNext}
                        </p>
                      ) : null}
                      {leadEligibleForConvert(l) ? (
                        <div className="mt-2 space-y-1">
                          <button
                            type="button"
                            disabled={convertingLeadId === l.id}
                            onClick={() => void convertLeadToDeal(l.id)}
                            className="w-full rounded-md border border-premium-gold/50 bg-premium-gold/15 py-1 text-[10px] font-semibold text-premium-gold hover:bg-premium-gold/25 disabled:opacity-50"
                          >
                            {convertingLeadId === l.id ? "Converting…" : "Convert to deal"}
                          </button>
                          {convertHintByLead[l.id] ? (
                            <p className="text-[9px] text-slate-500">{convertHintByLead[l.id]}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
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
