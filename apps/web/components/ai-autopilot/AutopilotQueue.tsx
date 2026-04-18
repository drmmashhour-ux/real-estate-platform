"use client";

import type { AutopilotActionSort } from "@/modules/ai-autopilot";
import { AutopilotActionCard } from "./AutopilotActionCard";

type ActionShape = {
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
};

const SORT_LABELS: Record<AutopilotActionSort, string> = {
  quality: "Quality (high first)",
  urgency: "Priority bucket",
  newest: "Newest",
  domain: "Domain A–Z",
};

export function AutopilotQueue(props: {
  actions: ActionShape[];
  staleActions?: ActionShape[];
  sort: AutopilotActionSort;
  onSortChange: (s: AutopilotActionSort) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Ranked queue</h2>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Sort</span>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-200"
            value={props.sort}
            onChange={(e) => props.onSortChange(e.target.value as AutopilotActionSort)}
          >
            {(Object.keys(SORT_LABELS) as AutopilotActionSort[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {props.actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
          No active queue items. Run detection from the orchestrator (POST with <code className="text-zinc-400">persist: true</code>) or use your
          existing domain autopilots (listing optimization, deal autopilot, BNHub host settings).
        </div>
      ) : (
        <div className="space-y-4">
          {props.actions.map((a) => (
            <AutopilotActionCard key={a.id} {...a} onRefresh={props.onRefresh} />
          ))}
        </div>
      )}

      {props.staleActions && props.staleActions.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stale / archived / expired</h3>
          <p className="mt-1 text-xs text-zinc-600">Terminal states kept for audit — not shown in the main queue.</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {props.staleActions.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-zinc-500">{a.status}</span>
                <span className="text-zinc-300">{a.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
