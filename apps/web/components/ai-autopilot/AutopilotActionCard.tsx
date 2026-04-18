"use client";

import * as React from "react";
import { AutopilotReasonsPanel } from "./AutopilotReasonsPanel";
import { AutopilotApprovalPanel } from "./AutopilotApprovalPanel";

function formatTs(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export function AutopilotActionCard(props: {
  id: string;
  title: string;
  domain: string;
  riskLevel: string;
  status: string;
  summary: string;
  reasons: unknown;
  qualityScore?: number | null;
  priorityBucket?: string | null;
  duplicateCount?: number;
  lastRefreshedAt?: Date | string | null;
  updatedAt?: Date | string;
  onRefresh: () => void;
}) {
  const dup = props.duplicateCount ?? 0;
  const refreshed = formatTs(props.lastRefreshedAt) ?? formatTs(props.updatedAt);
  const reasonsObj = props.reasons && typeof props.reasons === "object" ? (props.reasons as Record<string, unknown>) : null;
  const v8Kind = reasonsObj && typeof reasonsObj.v8InfluenceKind === "string" ? reasonsObj.v8InfluenceKind : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">{props.domain}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{props.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.qualityScore != null && (
            <span
              className="rounded-full border border-emerald-600/50 bg-emerald-950/40 px-2 py-0.5 text-xs font-mono text-emerald-200"
              title="Quality score (0–100)"
            >
              Q {props.qualityScore}
            </span>
          )}
          {props.priorityBucket && (
            <span className="rounded-full border border-amber-700/50 px-2 py-0.5 text-xs text-amber-200/90">{props.priorityBucket}</span>
          )}
          {v8Kind && (
            <span
              className="rounded-full border border-violet-700/50 bg-violet-950/40 px-2 py-0.5 text-xs text-violet-200/90"
              title="Ads Autopilot V8 influence (scoring only)"
            >
              V8 {v8Kind}
            </span>
          )}
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">{props.status}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{props.summary}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>
          Risk: <span className="text-zinc-300">{props.riskLevel}</span>
        </span>
        {dup > 0 && (
          <span className="text-sky-300/90" title="Times the same issue was re-detected">
            Duplicate merges: {dup}
          </span>
        )}
        {refreshed && dup > 0 && <span className="text-zinc-500">Refreshed {refreshed}</span>}
      </div>
      <AutopilotReasonsPanel reasons={props.reasons} />
      <AutopilotApprovalPanel id={props.id} status={props.status} riskLevel={props.riskLevel} onDone={props.onRefresh} />
    </div>
  );
}
