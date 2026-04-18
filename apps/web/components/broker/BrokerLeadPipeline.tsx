"use client";

import * as React from "react";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";
import type { BrokerDealSummary } from "@/modules/broker/closing/broker-deal-summary.service";

export type PipelineItem = {
  leadId: string;
  name: string;
  score: number;
  stage: LeadClosingStage;
  responseSpeed: "fast" | "average" | "slow";
  lastContactAt?: string | null;
  responseReceived: boolean;
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

export function BrokerLeadPipeline({
  summary,
  items,
  busyId,
  onSetStage,
  onContacted,
  onResponded,
  accent = "#10b981",
}: {
  summary: BrokerDealSummary;
  items: PipelineItem[];
  busyId: string | null;
  onSetStage: (leadId: string, stage: LeadClosingStage) => void;
  onContacted: (leadId: string) => void;
  onResponded: (leadId: string) => void;
  accent?: string;
}) {
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

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[900px] gap-3">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex w-[200px] shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.02]">
              <div
                className="border-b border-white/10 px-2 py-2 text-center text-xs font-semibold text-white"
                style={{ borderColor: `${accent}33` }}
              >
                {col.label}
                <span className="ml-1 text-slate-500">({byStage.get(col.id)?.length ?? 0})</span>
              </div>
              <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto p-2">
                {(byStage.get(col.id) ?? []).map((it) => (
                  <div
                    key={it.leadId}
                    className="rounded-lg border border-white/10 bg-black/30 p-2 text-left text-xs"
                  >
                    <p className="font-medium text-white line-clamp-2">{it.name}</p>
                    <p className="mt-0.5 text-slate-500">Score {it.score}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{speedLabel(it.responseSpeed)}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Client reply: {it.responseReceived ? "yes (signal)" : "not yet"}
                    </p>
                    {it.lastContactAt ? (
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Last contact: {new Date(it.lastContactAt).toLocaleString()}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-slate-500">Last contact: —</p>
                    )}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Stages sync to your CRM pipeline. “Mark responded” records that the client replied (your confirmation) — not an
        automated send.
      </p>
    </div>
  );
}
