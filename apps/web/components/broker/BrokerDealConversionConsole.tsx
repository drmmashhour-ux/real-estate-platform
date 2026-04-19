"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { BrokerLeadPipeline, type PipelineItem } from "./BrokerLeadPipeline";
import type { BrokerDealSummary } from "@/modules/broker/closing/broker-deal-summary.service";
import type {
  BrokerNextBestAction,
  DailyStripCounts,
  TopThreeToCloseRow,
} from "@/modules/broker/closing/broker-next-action.service";
import { computeIdleHours } from "@/modules/broker/closing/broker-next-action.service";
import {
  buildLeadHighlightSets,
  rankLeadsForConversionConsole,
} from "@/modules/broker/closing/broker-top-leads.service";
import type { ConversionLeadMomentum } from "@/modules/broker/closing/broker-top-leads.service";
import type { LeadClosingStage, LeadClosingState } from "@/modules/broker/closing/broker-closing.types";
import type { BrokerAiAssistSummary } from "@/modules/broker/ai-assist/broker-ai-assist.types";

type ApiItem = {
  leadId: string;
  name: string;
  score: number;
  closing: LeadClosingState;
  suggestions: { id: string; type: string; title: string; description: string; urgency: string }[];
  responseSpeed: "fast" | "average" | "slow";
  nextAction: BrokerNextBestAction;
};

function postMetric(payload: Record<string, unknown>): void {
  void fetch("/api/broker/closing/metrics", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function postAssistMetric(payload: Record<string, unknown>): void {
  void fetch("/api/broker/ai-assist/metrics", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

const MOMENTUM_LABEL: Record<ConversionLeadMomentum, string> = {
  needs_action_now: "Needs action now",
  hot_lead: "Hot lead (score + stage)",
  cooling_down: "Cooling down (idle)",
  steady: "Steady",
};

function daysSinceLastContact(lastIso: string | undefined | null, createdIso: string | undefined): number | null {
  const raw = lastIso ?? createdIso;
  if (!raw) return null;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

export function BrokerDealConversionConsole({ accent = "#10b981" }: { accent?: string }) {
  const params = useParams<{ locale?: string; country?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const country = typeof params?.country === "string" ? params.country : "ca";

  const openedRef = React.useRef(false);

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<BrokerDealSummary | null>(null);
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [dailyStrip, setDailyStrip] = React.useState<DailyStripCounts | null>(null);
  const [topThree, setTopThree] = React.useState<TopThreeToCloseRow[]>([]);
  const [messagingAssistEnabled, setMessagingAssistEnabled] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [assistLoading, setAssistLoading] = React.useState(false);
  const [assistSummary, setAssistSummary] = React.useState<BrokerAiAssistSummary | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);
  const [sessionActive, setSessionActive] = React.useState(false);
  const [sessionQueue, setSessionQueue] = React.useState<string[]>([]);
  const [sessionCursor, setSessionCursor] = React.useState(0);

  const sessionRef = React.useRef<{ active: boolean; queue: string[]; cursor: number }>({
    active: false,
    queue: [],
    cursor: 0,
  });

  const buildLeadHref = React.useCallback(
    (leadId: string, closingDraftHint: string | null) => {
      const base = `/${locale}/${country}/dashboard/leads/${encodeURIComponent(leadId)}`;
      if (!closingDraftHint) return base;
      const q = new URLSearchParams();
      q.set("closingDraftHint", closingDraftHint);
      return `${base}?${q.toString()}`;
    },
    [locale, country],
  );

  const load = React.useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/broker/closing", { credentials: "same-origin" });
      if (res.status === 404) {
        setSummary(null);
        setItems([]);
        setDailyStrip(null);
        setTopThree([]);
        setErr("Closing workspace is not enabled.");
        return;
      }
      const data = (await res.json()) as {
        summary?: BrokerDealSummary;
        items?: ApiItem[];
        dailyStrip?: DailyStripCounts;
        topThreeToClose?: TopThreeToCloseRow[];
        messagingAssistEnabled?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "Failed to load");
        return;
      }
      setSummary(data.summary ?? null);
      setItems(Array.isArray(data.items) ? data.items : []);
      setDailyStrip(data.dailyStrip ?? null);
      setTopThree(Array.isArray(data.topThreeToClose) ? data.topThreeToClose : []);
      setMessagingAssistEnabled(data.messagingAssistEnabled === true);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    postMetric({ event: "conversion_console_opened" });
  }, []);

  /** Bridge minimal LeadClosingState for ranking — brokerId not used in idle/score */
  const closingFull = React.useMemo(() => {
    return items.map((i) => ({
      leadId: i.leadId,
      name: i.name,
      score: i.score,
      closing: {
        leadId: i.leadId,
        brokerId: "local",
        stage: i.closing.stage,
        lastContactAt: i.closing.lastContactAt,
        responseReceived: i.closing.responseReceived,
        createdAt: i.closing.createdAt ?? i.closing.lastContactAt ?? new Date().toISOString(),
        updatedAt: i.closing.updatedAt ?? i.closing.lastContactAt ?? new Date().toISOString(),
      },
      nextAction: i.nextAction,
    }));
  }, [items]);

  const rankedFixed = React.useMemo(() => {
    return rankLeadsForConversionConsole(closingFull, Date.now());
  }, [closingFull]);

  const highlights = React.useMemo(() => {
    const rows = closingFull.map((r) => ({
      leadId: r.leadId,
      name: r.name,
      score: r.score,
      closing: r.closing,
      nextAction: r.nextAction,
    }));
    return buildLeadHighlightSets(rankLeadsForConversionConsole(rows, Date.now()), topThree, Date.now());
  }, [closingFull, topThree]);

  const selectedRanked = React.useMemo(
    () => rankedFixed.find((r) => r.leadId === selectedLeadId),
    [rankedFixed, selectedLeadId],
  );

  const selectedItem = React.useMemo(() => items.find((i) => i.leadId === selectedLeadId), [items, selectedLeadId]);

  React.useEffect(() => {
    if (!selectedLeadId) return;
    postMetric({ event: "conversion_focus_lead", leadId: selectedLeadId });
  }, [selectedLeadId]);

  React.useEffect(() => {
    if (!selectedLeadId) {
      setAssistSummary(null);
      setAssistLoading(false);
      return;
    }
    let cancelled = false;
    setAssistLoading(true);
    void fetch(`/api/broker/ai-assist?leadId=${encodeURIComponent(selectedLeadId)}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { assist?: BrokerAiAssistSummary };
      })
      .then((data) => {
        if (cancelled) return;
        setAssistSummary(data?.assist ?? null);
      })
      .catch(() => {
        if (!cancelled) setAssistSummary(null);
      })
      .finally(() => {
        if (!cancelled) setAssistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLeadId]);

  const advanceSessionAfterAction = React.useCallback(() => {
    if (!sessionActive || sessionQueue.length === 0) return;
    setSessionCursor((c) => {
      const next = c + 1;
      if (next >= sessionQueue.length) {
        postMetric({ event: "conversion_session_completed" });
        setSessionActive(false);
        return c;
      }
      const nid = sessionQueue[next];
      setSelectedLeadId(nid);
      return next;
    });
  }, [sessionActive, sessionQueue]);

  const patch = React.useCallback(
    async (
      leadId: string,
      action: "contacted" | "responded" | "set_stage",
      stage: LeadClosingStage | undefined,
      metricAction: string,
    ) => {
      setBusyId(leadId);
      try {
        const res = await fetch("/api/broker/closing", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, action, stage }),
        });
        const j = (await res.json()) as { error?: string; applied?: boolean };
        if (!res.ok) {
          setErr(j.error ?? "Update failed");
          return;
        }
        setErr(null);
        if (j.applied === false) {
          setActionFeedback("Already up to date — no pipeline change.");
        } else {
          setActionFeedback(null);
        }
        postMetric({ event: "conversion_next_action_executed", action: metricAction });
        await load();
        advanceSessionAfterAction();
      } catch {
        setErr("Network error");
      } finally {
        setBusyId(null);
      }
    },
    [load, advanceSessionAfterAction],
  );

  const startClosingSession = React.useCallback(() => {
    const q = topThree.length > 0 ? topThree.map((t) => t.leadId) : rankedFixed.slice(0, 5).map((r) => r.leadId);
    if (q.length === 0) return;
    postMetric({ event: "conversion_session_started" });
    setSessionQueue(q);
    setSessionCursor(0);
    setSessionActive(true);
    setSelectedLeadId(q[0] ?? null);
  }, [topThree, rankedFixed]);

  const endClosingSession = React.useCallback(() => {
    if (sessionActive) postMetric({ event: "conversion_session_completed" });
    setSessionActive(false);
    setSessionQueue([]);
    setSessionCursor(0);
  }, [sessionActive]);

  const pipelineItems: PipelineItem[] = React.useMemo(
    () =>
      items.map((i) => ({
        leadId: i.leadId,
        name: i.name,
        score: i.score,
        stage: i.closing.stage,
        responseSpeed: i.responseSpeed,
        lastContactAt: i.closing.lastContactAt ?? null,
        responseReceived: i.closing.responseReceived,
        nextAction: i.nextAction,
      })),
    [items],
  );

  const focusFirstNeedingAttention = React.useCallback(() => {
    const row = items.find((i) => i.nextAction.urgency === "high" || i.closing.stage === "new");
    setSelectedLeadId(row?.leadId ?? items[0]?.leadId ?? null);
  }, [items]);

  const focusFirstOverdue = React.useCallback(() => {
    const row = items.find((i) => {
      const idle = computeIdleHours(
        {
          leadId: i.leadId,
          brokerId: "",
          stage: i.closing.stage,
          lastContactAt: i.closing.lastContactAt,
          responseReceived: i.closing.responseReceived,
          createdAt: i.closing.lastContactAt ?? "",
          updatedAt: i.closing.lastContactAt ?? "",
        },
        Date.now(),
      );
      return i.closing.stage === "contacted" && !i.closing.responseReceived && idle != null && idle >= 48;
    });
    setSelectedLeadId(row?.leadId ?? null);
  }, [items]);

  const focusFirstRespondedWaiting = React.useCallback(() => {
    const row = items.find((i) => {
      const idle = computeIdleHours(
        {
          leadId: i.leadId,
          brokerId: "",
          stage: i.closing.stage,
          lastContactAt: i.closing.lastContactAt,
          responseReceived: i.closing.responseReceived,
          createdAt: i.closing.lastContactAt ?? "",
          updatedAt: i.closing.lastContactAt ?? "",
        },
        Date.now(),
      );
      return i.closing.stage === "responded" && idle != null && idle >= 24;
    });
    setSelectedLeadId(row?.leadId ?? null);
  }, [items]);

  const focusTopThreeFirst = React.useCallback(() => {
    setSelectedLeadId(topThree[0]?.leadId ?? null);
  }, [topThree]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-slate-400">Loading deal conversion console…</p>
      </section>
    );
  }

  if (err || !summary) {
    return err ? (
      <section className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200">{err}</section>
    ) : null;
  }

  const primarySuggestion = selectedItem?.suggestions[0];
  const idleDays =
    selectedItem &&
    daysSinceLastContact(selectedItem.closing.lastContactAt, selectedItem.closing.createdAt ?? undefined);

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Deal conversion console</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Close more deals — one focused workspace</h2>
        <p className="mt-1 text-sm text-slate-400">
          Deterministic hints only; you execute every change. Nothing sends automatically.
        </p>
      </header>

      {/* TOP STRIP — Daily Command */}
      <div className="rounded-xl border border-white/15 bg-gradient-to-r from-slate-900/80 to-slate-950/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => focusFirstNeedingAttention()}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-left text-xs text-white hover:bg-white/10"
            >
              <span className="block text-[10px] uppercase tracking-wide text-slate-500">Needs attention</span>
              <span className="text-lg font-semibold">{dailyStrip?.needsActionToday ?? 0}</span>
            </button>
            <button
              type="button"
              onClick={() => focusFirstOverdue()}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-left text-xs text-white hover:bg-white/10"
            >
              <span className="block text-[10px] uppercase tracking-wide text-slate-500">Overdue follow-ups</span>
              <span className="text-lg font-semibold text-amber-200">{dailyStrip?.overdueFollowUps ?? 0}</span>
            </button>
            <button
              type="button"
              onClick={() => focusFirstRespondedWaiting()}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-left text-xs text-white hover:bg-white/10"
            >
              <span className="block text-[10px] uppercase tracking-wide text-slate-500">Responded → next step</span>
              <span className="text-lg font-semibold text-sky-200">{dailyStrip?.respondedWaitingNextStep ?? 0}</span>
            </button>
            <button
              type="button"
              onClick={() => focusFirstHighPriority()}
              className="rounded-lg border border-violet-500/30 bg-violet-950/30 px-3 py-2 text-left text-xs text-white hover:bg-violet-950/45"
            >
              <span className="block text-[10px] uppercase tracking-wide text-violet-300/90">High priority</span>
              <span className="text-lg font-semibold text-violet-100">{dailyStrip?.highPriorityLeads ?? 0}</span>
            </button>
            <button
              type="button"
              onClick={() => focusTopThreeFirst()}
              className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-left text-xs text-white hover:bg-emerald-950/50"
            >
              <span className="block text-[10px] uppercase tracking-wide text-emerald-400/90">Top 3 today</span>
              <span className="text-lg font-semibold text-emerald-100">{topThree.length}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {!sessionActive ? (
              <button
                type="button"
                onClick={() => startClosingSession()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-500"
              >
                Start closing session
              </button>
            ) : (
              <button
                type="button"
                onClick={() => endClosingSession()}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                End session ({sessionCursor + 1}/{sessionQueue.length})
              </button>
            )}
          </div>
        </div>
        {topThree.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <span className="w-full text-[10px] uppercase tracking-wide text-slate-500">Top 3 — click to focus</span>
            {topThree.map((t, idx) => (
              <button
                key={t.leadId}
                type="button"
                onClick={() => setSelectedLeadId(t.leadId)}
                className={`rounded-lg border px-3 py-1.5 text-left text-xs ${
                  selectedLeadId === t.leadId
                    ? "border-emerald-400/60 bg-emerald-950/40 text-white"
                    : "border-white/10 bg-black/30 text-slate-200 hover:bg-white/5"
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500">{idx + 1}.</span> {t.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,360px)_1fr]">
        {/* LEFT — Pipeline */}
        <div className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline</h3>
          <p className="mb-2 text-[10px] text-slate-500">
            Emerald ring = top 3 · Rose = urgent · Amber = idle 72h+
          </p>
          <BrokerLeadPipeline
            summary={summary}
            items={pipelineItems}
            busyId={busyId}
            accent={accent}
            buildLeadHref={buildLeadHref}
            messagingAssistEnabled={messagingAssistEnabled}
            variant="compact"
            hideSummaryStats
            selectedLeadId={selectedLeadId}
            onSelectLead={(id) => setSelectedLeadId(id)}
            highlights={{
              topThreeIds: highlights.topThreeIds,
              urgentIds: highlights.urgentIds,
              stuckIds: highlights.stuckIds,
            }}
            suppressCardActions
            onSetStage={() => {}}
            onContacted={() => {}}
            onResponded={() => {}}
          />
        </div>

        {/* RIGHT — Focus & actions */}
        <div className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-4">
          {!selectedItem ? (
            <p className="text-sm text-slate-400">Select a lead from the pipeline or top strip.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedItem.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Stage: <span className="text-slate-200">{selectedItem.closing.stage}</span> · Reply signal:{" "}
                    <span className="text-slate-200">{selectedItem.closing.responseReceived ? "yes" : "no"}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Last contact:{" "}
                    {selectedItem.closing.lastContactAt
                      ? new Date(selectedItem.closing.lastContactAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                {selectedRanked ? (
                  <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                    {MOMENTUM_LABEL[selectedRanked.momentum]}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-500">Days since contact</p>
                  <p className="text-xl font-semibold text-white">{idleDays ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-500">Lead score</p>
                  <p className="text-xl font-semibold text-white">{selectedItem.score}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-[10px] uppercase text-slate-500">Priority score</p>
                  <p className="text-xl font-semibold text-emerald-200">{selectedRanked?.conversionScore ?? "—"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">Next best action</p>
                <p className="mt-2 text-xl font-semibold text-white">{selectedItem.nextAction.actionLabel}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectedItem.nextAction.urgency === "high"
                        ? "bg-rose-500/30 text-rose-100"
                        : selectedItem.nextAction.urgency === "medium"
                          ? "bg-amber-500/25 text-amber-100"
                          : "bg-slate-600/40 text-slate-200"
                    }`}
                  >
                    {selectedItem.nextAction.urgency}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedItem.nextAction.reason}</p>
              </div>

              {assistLoading ? (
                <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-950/15 p-3 text-xs text-slate-400">
                  Loading AI assist…
                </div>
              ) : assistSummary ? (
                <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-950/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/90">
                      AI assist · <span className="text-sky-100/90">Suggested</span>
                    </p>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-slate-400">
                      Advisory only · draft-only
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-snug text-white">{assistSummary.primaryRecommendation}</p>
                  {assistSummary.topSignals.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      {assistSummary.topSignals.map((s) => (
                        <li key={s.signalType}>
                          <span className="font-medium text-slate-100">{s.label}</span> — {s.description}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {assistSummary.topSuggestions[0]?.suggestedAction ? (
                    <p className="mt-3 text-xs text-slate-400">
                      <span className="text-slate-500">Suggested action:</span> {assistSummary.topSuggestions[0].title}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={buildLeadHref(
                        selectedItem.leadId,
                        assistSummary.topSuggestions.find((s) => s.draftHint)?.draftHint ??
                          selectedItem.nextAction.followUpDraftHint,
                      )}
                      onClick={() =>
                        postAssistMetric({ event: "assist_draft_opened", leadId: selectedItem.leadId })
                      }
                      className="rounded-lg border border-sky-500/45 bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-950/70"
                    >
                      Open suggested draft
                    </a>
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                      onClick={() => {
                        postAssistMetric({ event: "assist_guidance_used", leadId: selectedItem.leadId });
                        void navigator.clipboard?.writeText(assistSummary.primaryRecommendation);
                      }}
                    >
                      Use this guidance (copy)
                    </button>
                  </div>
                </div>
              ) : null}

              {primarySuggestion ? (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Suggested follow-up type</p>
                  <p className="mt-1 text-sm font-medium text-white">{primarySuggestion.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{primarySuggestion.description}</p>
                  {messagingAssistEnabled && selectedItem.nextAction.followUpDraftHint ? (
                    <a
                      href={buildLeadHref(selectedItem.leadId, selectedItem.nextAction.followUpDraftHint)}
                      onClick={() => postMetric({ event: "conversion_draft_opened" })}
                      className="mt-3 inline-flex rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
                    >
                      Open message draft (hint)
                    </a>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      Guidance: use the suggestion above manually. Enable messaging assist for hinted draft links.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={
                    selectedItem.nextAction.followUpDraftHint
                      ? buildLeadHref(selectedItem.leadId, selectedItem.nextAction.followUpDraftHint)
                      : buildLeadHref(selectedItem.leadId, null)
                  }
                  onClick={() => postMetric({ event: "conversion_draft_opened" })}
                  className="rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-950/70"
                >
                  Open message draft
                </a>
                <button
                  type="button"
                  disabled={busyId === selectedItem.leadId}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                  onClick={() =>
                    void patch(selectedItem.leadId, "contacted", undefined, "contacted")
                  }
                >
                  Mark contacted
                </button>
                <button
                  type="button"
                  disabled={busyId === selectedItem.leadId}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                  onClick={() =>
                    void patch(selectedItem.leadId, "responded", undefined, "responded")
                  }
                >
                  Mark responded
                </button>
                <button
                  type="button"
                  disabled={busyId === selectedItem.leadId}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                  onClick={() =>
                    void patch(selectedItem.leadId, "set_stage", "meeting_scheduled", "set_stage:meeting_scheduled")
                  }
                >
                  Mark meeting
                </button>
                <button
                  type="button"
                  disabled={busyId === selectedItem.leadId}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                  onClick={() =>
                    void patch(selectedItem.leadId, "set_stage", "negotiation", "set_stage:negotiation")
                  }
                >
                  Move to negotiation
                </button>
                <button
                  type="button"
                  disabled={busyId === selectedItem.leadId}
                  className="rounded-lg border border-rose-500/40 px-3 py-2 text-xs text-rose-200 hover:bg-rose-950/40 disabled:opacity-50"
                  onClick={() =>
                    void patch(selectedItem.leadId, "set_stage", "closed_lost", "set_stage:closed_lost")
                  }
                >
                  Mark lost
                </button>
              </div>

              <label className="mt-4 block text-[10px] uppercase text-slate-500">
                Move stage
                <select
                  className="mt-1 w-full max-w-md rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                  value={selectedItem.closing.stage}
                  disabled={busyId === selectedItem.leadId}
                  onChange={(e) =>
                    void patch(
                      selectedItem.leadId,
                      "set_stage",
                      e.target.value as LeadClosingStage,
                      `set_stage:${e.target.value}`,
                    )
                  }
                >
                  {[
                    "new",
                    "contacted",
                    "responded",
                    "meeting_scheduled",
                    "negotiation",
                    "closed_won",
                    "closed_lost",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM — Insights */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-sm font-semibold text-white">Conversion insights</h3>
        {summary.insights ? (
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
            <p>{summary.insights.concentrationAdvisory}</p>
            <p>{summary.insights.followUpDebtAdvisory}</p>
            <p>{summary.insights.stuckPatternAdvisory}</p>
            <p>{summary.insights.followUpDebtTrendNote}</p>
          </div>
        ) : null}
        <p className="mt-3 text-[11px] text-slate-500">
          Response rate trend: not computed server-side in V1 — use pipeline counts and your CRM for reporting.
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          Recommendation: if most leads sit at <strong className="font-medium text-slate-400">contacted</strong>,
          shorten follow-up intervals and advance stages only after you confirm outcomes.
        </p>
      </div>
    </section>
  );
}
