"use client";

import * as React from "react";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";
import type { BrokerDealSummary } from "@/modules/broker/closing/broker-deal-summary.service";
import type { BrokerNextBestAction } from "@/modules/broker/closing/broker-next-action.service";

export type PipelineItem = {
  leadId: string;
  name: string;
  score: number;
  stage: LeadClosingStage;
  responseSpeed: "fast" | "average" | "slow";
  lastContactAt?: string | null;
  responseReceived: boolean;
  nextAction: BrokerNextBestAction;
};

export type PipelineHighlights = {
  topThreeIds: Set<string>;
  urgentIds: Set<string>;
  stuckIds: Set<string>;
};

const COLUMNS: { id: LeadClosingStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "responded", label: "Responded" },
  { id: "meeting_scheduled", label: "Meeting" },
  { id: "negotiation", label: "Negotiation" },
  { id: "closed_won", label: "Won" },
  { id: "closed_lost", label: "Lost" },
];

function speedLabel(s: PipelineItem["responseSpeed"]): string {
  if (s === "fast") return "Response cadence: fast";
  if (s === "slow") return "Response cadence: slow";
  return "Response cadence: average";
}

function urgencyBadgeClass(u: BrokerNextBestAction["urgency"]): string {
  if (u === "high") return "bg-rose-500/25 text-rose-100 border-rose-500/40";
  if (u === "medium") return "bg-amber-500/20 text-amber-100 border-amber-500/35";
  return "bg-slate-600/30 text-slate-200 border-white/15";
}

function highlightRingClass(leadId: string, h?: PipelineHighlights): string {
  if (!h) return "border-white/10";
  if (h.topThreeIds.has(leadId)) return "border-emerald-400/70 ring-2 ring-emerald-400/50";
  if (h.urgentIds.has(leadId)) return "border-rose-400/60 ring-2 ring-rose-500/40";
  if (h.stuckIds.has(leadId)) return "border-amber-400/50 ring-1 ring-amber-400/35";
  return "border-white/10";
}

function recordDraftOpenIntent(): void {
  void fetch("/api/broker/closing/metrics", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "followup_draft_opened" }),
  }).catch(() => {});
}

export function BrokerLeadPipeline({
  summary,
  items,
  busyId,
  onSetStage,
  onContacted,
  onResponded,
  buildLeadHref,
  messagingAssistEnabled,
  accent = "#10b981",
  variant = "full",
  hideSummaryStats = false,
  selectedLeadId = null,
  onSelectLead,
  highlights,
  suppressCardActions = false,
}: {
  summary: BrokerDealSummary;
  items: PipelineItem[];
  busyId: string | null;
  onSetStage: (leadId: string, stage: LeadClosingStage) => void;
  onContacted: (leadId: string) => void;
  onResponded: (leadId: string) => void;
  buildLeadHref: (leadId: string, closingDraftHint: string | null) => string;
  messagingAssistEnabled: boolean;
  accent?: string;
  variant?: "full" | "compact";
  hideSummaryStats?: boolean;
  selectedLeadId?: string | null;
  onSelectLead?: (leadId: string) => void;
  highlights?: PipelineHighlights;
  /** When true (e.g. conversion console), actions live in the side panel — cards are for scan + select */
  suppressCardActions?: boolean;
}) {
  const compact = variant === "compact";
  const colWidth = compact ? "min-w-[140px] w-[140px]" : "min-w-[220px] w-[220px]";
  const boardMin = compact ? "min-w-[720px]" : "min-w-[900px]";
  const maxColH = compact ? "max-h-[440px]" : "max-h-[560px]";

  const byStage = React.useMemo(() => {
    const m = new Map<LeadClosingStage, PipelineItem[]>();
    for (const c of COLUMNS) m.set(c.id, []);
    for (const it of items) {
      const list = m.get(it.stage) ?? [];
      list.push(it);
      m.set(it.stage, list);
    }
    return m;
  }, [items]);

  return (
    <div className="space-y-4">
      {!hideSummaryStats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Leads</p>
            <p className="text-lg font-semibold text-white">{summary.totalLeads}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Active progress</p>
            <p className="text-lg font-semibold text-white">{Math.round(summary.activeProgressRate * 100)}%</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Win rate (approx.)</p>
            <p className="text-lg font-semibold text-white">{Math.round(summary.winRateApprox * 100)}%</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Meetings</p>
            <p className="text-lg font-semibold text-white">{summary.meetings}</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto pb-2">
        <div className={`flex ${boardMin} gap-2`}>
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`flex ${colWidth} shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02]`}
            >
              <div
                className="border-b border-white/10 px-1.5 py-1.5 text-center text-[11px] font-semibold text-white"
                style={{ borderColor: `${accent}33` }}
              >
                {col.label}
                <span className="ml-1 text-slate-500">({byStage.get(col.id)?.length ?? 0})</span>
              </div>
              <div className={`flex ${maxColH} flex-col gap-1.5 overflow-y-auto p-1.5`}>
                {(byStage.get(col.id) ?? []).map((it) => {
                  const hint = it.nextAction.followUpDraftHint;
                  const draftHref = hint ? buildLeadHref(it.leadId, hint) : buildLeadHref(it.leadId, null);
                  const selected = selectedLeadId === it.leadId;
                  const ring = highlightRingClass(it.leadId, highlights);

                  const body = (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-0.5">
                        <p className={`font-medium text-white line-clamp-2 ${compact ? "text-[11px]" : ""}`}>{it.name}</p>
                        <span
                          className={`shrink-0 rounded-full border px-1 py-0.5 text-[8px] font-bold uppercase ${urgencyBadgeClass(
                            it.nextAction.urgency,
                          )}`}
                        >
                          {it.nextAction.urgency}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 font-medium leading-tight text-slate-200 ${compact ? "text-[10px]" : "text-[11px]"}`}
                        style={{ color: `${accent}ee` }}
                      >
                        {it.nextAction.actionLabel}
                      </p>
                      <p
                        className={`mt-0.5 leading-snug text-slate-400 line-clamp-2 ${compact ? "text-[9px]" : "text-[10px]"}`}
                        title={it.nextAction.reason}
                      >
                        Why now: {it.nextAction.reason}
                      </p>
                      <p className="mt-0.5 text-[9px] text-slate-500">★{it.score}</p>
                      {!suppressCardActions ? (
                        <>
                          <p className="mt-0.5 text-[10px] text-slate-500">{speedLabel(it.responseSpeed)}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Reply: {it.responseReceived ? "yes" : "no"}
                          </p>
                          {it.lastContactAt ? (
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              Last: {new Date(it.lastContactAt).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[10px] text-slate-500">Last: —</p>
                          )}
                        </>
                      ) : null}
                      {!suppressCardActions ? (
                        <div className="mt-2 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500">
                            Move stage
                            <select
                              className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-1 py-1 text-[11px] text-white"
                              value={it.stage}
                              disabled={busyId === it.leadId}
                              onChange={(e) => onSetStage(it.leadId, e.target.value as LeadClosingStage)}
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={busyId === it.leadId}
                              className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-white/5 disabled:opacity-50"
                              onClick={() => onContacted(it.leadId)}
                            >
                              Mark contacted
                            </button>
                            <button
                              type="button"
                              disabled={busyId === it.leadId}
                              className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-white/5 disabled:opacity-50"
                              onClick={() => onResponded(it.leadId)}
                            >
                              Mark responded
                            </button>
                            <a
                              href={draftHref}
                              onClick={() => {
                                recordDraftOpenIntent();
                              }}
                              className="rounded border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/10"
                            >
                              {messagingAssistEnabled ? "Open draft" : "Go to lead"}
                            </a>
                            <button
                              type="button"
                              disabled={busyId === it.leadId || it.stage === "closed_lost"}
                              className="rounded border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
                              onClick={() => onSetStage(it.leadId, "closed_lost")}
                            >
                              Mark lost
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  );

                  const containerClass = `rounded-lg border bg-black/30 text-left text-xs transition-colors ${
                    selected ? "bg-emerald-950/40" : ""
                  } ${ring} ${compact ? "p-1.5" : "p-2"}`;

                  if (suppressCardActions && onSelectLead) {
                    return (
                      <button
                        key={it.leadId}
                        type="button"
                        className={`${containerClass} w-full text-left`}
                        onClick={() => onSelectLead(it.leadId)}
                      >
                        {body}
                      </button>
                    );
                  }

                  return (
                    <div key={it.leadId} className={containerClass}>
                      {body}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {!compact ? (
        <p className="text-[11px] text-slate-500">
          Stages sync to your CRM pipeline. “Mark responded” is your confirmation — the platform does not verify outbound
          messages. “Open draft context” adds a hint on the lead page for messaging assist when enabled; otherwise it opens
          the lead for manual follow-up.
        </p>
      ) : null}
    </div>
  );
}
