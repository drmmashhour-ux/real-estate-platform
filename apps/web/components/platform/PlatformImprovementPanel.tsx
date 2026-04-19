import Link from "next/link";
import type { ReactNode } from "react";

import { formatRelativeAge } from "@/lib/platform/format-relative-age";
import { primaryGoFixHref, suggestedOwnerBucket } from "@/modules/platform/platform-improvement-links.constants";
import type { PlatformImprovementHistoryEvent } from "@/modules/platform/platform-improvement-state.service";
import type {
  MergedExecutionRow,
  PlatformImprovementExecutionPanelModel,
} from "@/modules/platform/platform-improvement-state.service";
import type {
  PlatformImprovementBundle,
  PlatformImprovementPriority,
  PlatformPriorityRecord,
} from "@/modules/platform/platform-improvement.types";
import type { ApprovalAuditEntry, ApprovalExecutionRequest } from "@/modules/platform/ops-assistant/approval-execution.types";
import type { ApprovalExecutionOutcomeSummary } from "@/modules/platform/ops-assistant/approval-execution-results.types";
import type {
  ApprovalExecutionReviewRecord,
  ApprovalExecutionReviewSummary,
} from "@/modules/platform/ops-assistant/approval-execution-review.types";
import type { FutureReviewCandidate } from "@/modules/platform/ops-assistant/future-review-candidate.types";
import type { FutureLowRiskActionProposal } from "@/modules/platform/ops-assistant/future-low-risk-proposal.types";
import type { OpsAssistantSuggestion } from "@/modules/platform/ops-assistant/ops-assistant.types";

import { FutureLowRiskProposalPanel } from "./FutureLowRiskProposalPanel";
import { FutureReviewCandidatePanel } from "./FutureReviewCandidatePanel";
import { OpsAssistantApprovalResultsPanel } from "./OpsAssistantApprovalResultsPanel";
import { OpsAssistantApprovalReviewPanel } from "./OpsAssistantApprovalReviewPanel";
import { OpsAssistantApprovalPanel } from "./OpsAssistantApprovalPanel";
import { OpsAssistantSuggestionsClient } from "./OpsAssistantSuggestionsClient";
import { PlatformImprovementExecutionActions } from "./PlatformImprovementExecutionActions";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-slate-200">{children}</div>
    </div>
  );
}

function NoMajorGaps({ label }: { label: string }) {
  return (
    <p className="rounded-md border border-emerald-900/50 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-100/95">
      No major gaps flagged here — <span className="font-medium">{label}</span> looks healthy under current advisory rules.
    </p>
  );
}

const BADGE: Record<string, string> = {
  new: "border-slate-600 bg-slate-900 text-slate-200",
  acknowledged: "border-sky-700 bg-sky-950/60 text-sky-200",
  planned: "border-violet-700 bg-violet-950/50 text-violet-200",
  in_progress: "border-amber-700 bg-amber-950/50 text-amber-200",
  done: "border-emerald-700 bg-emerald-950/50 text-emerald-200",
  dismissed: "border-zinc-600 bg-zinc-900 text-zinc-400",
};

function StatusBadge({ record }: { record: PlatformPriorityRecord }) {
  const cls = BADGE[record.status] ?? BADGE.new;
  const ts = pickStatusTimestamp(record);
  const age = ts ? formatRelativeAge(ts) : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {record.status.replace(/_/g, " ")}
      {age ? <span className="font-normal normal-case text-slate-400">· {age}</span> : null}
    </span>
  );
}

function pickStatusTimestamp(record: PlatformPriorityRecord): string | undefined {
  switch (record.status) {
    case "new":
      return record.createdAt;
    case "acknowledged":
      return record.acknowledgedAt ?? record.updatedAt;
    case "planned":
      return record.plannedAt ?? record.updatedAt;
    case "in_progress":
      return record.startedAt ?? record.updatedAt;
    case "done":
      return record.completedAt ?? record.updatedAt;
    case "dismissed":
      return record.dismissedAt ?? record.updatedAt;
    default:
      return record.updatedAt;
  }
}

function findMerged(merged: MergedExecutionRow[], id: string): MergedExecutionRow | undefined {
  return merged.find((m) => m.priority.id === id);
}

export function PlatformImprovementPanel({
  bundle,
  execution,
  weeklyFocus,
  recentHistory = [],
  opsAssistantByPriorityId = {},
  approvalQueue,
  approvalExecutionResults,
  governanceReview,
  futureLowRiskProposals,
  futureReviewCandidates,
  opsAssistantApproval,
}: {
  bundle: PlatformImprovementBundle;
  execution: PlatformImprovementExecutionPanelModel;
  weeklyFocus: PlatformImprovementPriority[];
  recentHistory?: PlatformImprovementHistoryEvent[];
  opsAssistantByPriorityId?: Record<string, OpsAssistantSuggestion[]>;
  approvalQueue?: {
    show: boolean;
    requests: ApprovalExecutionRequest[];
    audit: ApprovalAuditEntry[];
    killSwitch: boolean;
    mutationsEnabled: boolean;
  };
  approvalExecutionResults?: ApprovalExecutionOutcomeSummary | null;
  governanceReview?: {
    outcomeSummary: ApprovalExecutionOutcomeSummary;
    records: ApprovalExecutionReviewRecord[];
    reviewSummary: ApprovalExecutionReviewSummary;
    mutationsEnabled: boolean;
  };
  futureLowRiskProposals?: {
    initialProposals: FutureLowRiskActionProposal[];
    mutationsEnabled: boolean;
  };
  futureReviewCandidates?: {
    initialCandidates: FutureReviewCandidate[];
    mutationsEnabled: boolean;
  };
  opsAssistantApproval?: {
    executionEnabled: boolean;
    panelEnabled: boolean;
    killSwitch: boolean;
  };
}) {
  const { merged, followThrough, allResolved, noEnginePriorities } = execution;
  const progressPct =
    followThrough.total === 0 ? 0 : Math.round((followThrough.completed / followThrough.total) * 100);

  return (
    <section className="space-y-4" aria-label="Platform improvement execution">
      <header className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3">
        <h1 className="text-lg font-semibold text-amber-100">Platform improvement — execution bridge</h1>
        <p className="mt-1 text-xs text-slate-400">
          Internal operator workflow — generated {new Date(bundle.createdAt).toLocaleString()}. Ops assistant suggests
          actions; approval execution (when enabled) requires explicit approve → run. Does not modify Stripe, booking,
          ranking, or payments from this surface.
        </p>
      </header>

      {approvalQueue?.show ? (
        <OpsAssistantApprovalPanel
          initialRequests={approvalQueue.requests}
          initialAudit={approvalQueue.audit}
          killSwitch={approvalQueue.killSwitch}
          mutationsEnabled={approvalQueue.mutationsEnabled}
        />
      ) : null}

      {approvalExecutionResults ? (
        <OpsAssistantApprovalResultsPanel summary={approvalExecutionResults} />
      ) : null}

      {governanceReview ? (
        <OpsAssistantApprovalReviewPanel
          initialOutcomeSummary={governanceReview.outcomeSummary}
          initialRecords={governanceReview.records}
          initialReviewSummary={governanceReview.reviewSummary}
          mutationsEnabled={governanceReview.mutationsEnabled}
        />
      ) : null}

      {futureLowRiskProposals ? (
        <FutureLowRiskProposalPanel
          initialProposals={futureLowRiskProposals.initialProposals}
          mutationsEnabled={futureLowRiskProposals.mutationsEnabled}
        />
      ) : null}

      {futureReviewCandidates ? (
        <FutureReviewCandidatePanel
          initialCandidates={futureReviewCandidates.initialCandidates}
          mutationsEnabled={futureReviewCandidates.mutationsEnabled}
        />
      ) : null}

      {noEnginePriorities ? (
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
          No major issues detected — the advisory engine returned no priorities for this snapshot.
        </div>
      ) : null}

      {allResolved ? (
        <div className="rounded-lg border border-teal-800/40 bg-teal-950/25 px-4 py-3 text-sm text-teal-100">
          All current priorities resolved — nice. Refresh later or when flags change to surface new diagnostics.
        </div>
      ) : null}

      <Section title="Follow-through">
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-600/90 transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Progress {followThrough.completed} / {followThrough.total} done
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Total" value={followThrough.total} />
          <Metric label="New" value={followThrough.newCount} />
          <Metric label="In progress" value={followThrough.inProgress} tone="amber" />
          <Metric label="Done" value={followThrough.completed} tone="emerald" />
          <Metric label="Dismissed" value={followThrough.dismissed} tone="muted" />
          <Metric label="Ack / Plan" value={followThrough.acknowledged + followThrough.planned} />
        </div>
      </Section>

      <Section title={`Top 3 this week (${bundle.weekKey})`}>
        <p className="text-[11px] text-slate-500">
          Highest urgency × impact among active items (excludes done/dismissed). Max three; deterministic ordering.
        </p>
        {weeklyFocus.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing active to focus — clear done items or wait for new diagnostics.</p>
        ) : (
          <ul className="space-y-3">
            {weeklyFocus.map((p) => {
              const row = findMerged(merged, p.id);
              const record = row?.record;
              return (
                <li key={`wf-${p.id}`} className="rounded-md border border-amber-900/40 bg-slate-950/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">{p.title}</span>
                    {record ? <StatusBadge record={record} /> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {p.category} · {p.urgency}
                  </p>
                  {record ? (
                    <div className="mt-2">
                      <PlatformImprovementExecutionActions priorityId={p.id} status={record.status} compact />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Priorities — track & execute">
        <ol className="list-decimal space-y-5 pl-4">
          {merged.map(({ priority: p, record, history: statusLog }) => (
            <li key={p.id} className="rounded-md border border-slate-800/80 bg-slate-950/30 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-white">{p.title}</span>
                  <span className="ml-2 text-[11px] uppercase text-slate-500">
                    {p.category} · {p.urgency}
                  </span>
                </div>
                <StatusBadge record={record} />
              </div>

              <div className="mt-2 space-y-2 text-xs text-slate-300">
                <p>
                  <span className="font-semibold text-slate-200">Impact:</span> {record.impact}
                </p>
                <p>
                  <span className="font-semibold text-slate-200">Why it matters:</span> {p.whyItMatters}
                </p>
                <p className="text-slate-400">{p.why}</p>
                <p>
                  <span className="font-semibold text-slate-200">Suggested owner:</span>{" "}
                  <span className="text-teal-200/90">{suggestedOwnerBucket(p.category)}</span>{" "}
                  <span className="text-slate-500">({p.suggestedOwnerArea})</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-200">Next step:</span> {p.suggestedNextStep}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryGoFixHref(p.category)}
                  className="inline-flex items-center rounded border border-amber-600/60 bg-amber-950/30 px-3 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-900/40"
                >
                  Go fix →
                </Link>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {p.executionLinks.map((link) => (
                    <Link
                      key={`${p.id}-${link.href}`}
                      href={link.href}
                      className="text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-slate-200"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <OpsAssistantSuggestionsClient
                priorityId={p.id}
                suggestions={opsAssistantByPriorityId[p.id] ?? []}
                approval={opsAssistantApproval}
              />

              <div className="mt-3">
                <PlatformImprovementExecutionActions priorityId={p.id} status={record.status} />
              </div>

              <details className="mt-2 text-[11px] text-slate-500">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-300">Priority history</summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {statusLog.map((ev, i) => (
                    <li key={`${ev.at}-${ev.kind}-${i}`}>
                      <span className="text-slate-400">{new Date(ev.at).toLocaleString()}</span> —{" "}
                      {ev.kind.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </Section>

      {recentHistory.length > 0 ? (
        <Section title="Recent status changes">
          <ul className="space-y-1 text-[11px] text-slate-400">
            {recentHistory.map((e, i) => (
              <li key={`${e.at}-${e.priorityId}-${i}`}>
                {new Date(e.at).toLocaleString()} — <span className="text-slate-300">{e.priorityId.slice(0, 8)}…</span>{" "}
                {e.from} → {e.to}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Monetization gaps">
        {bundle.monetization.highPriorityMonetizationGaps.length === 0 ? (
          <NoMajorGaps label="High-priority monetization" />
        ) : (
          <ul className="list-disc space-y-1 pl-4 text-slate-300">
            {bundle.monetization.highPriorityMonetizationGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Trust gaps">
        {bundle.trust.coverageGaps.length === 0 ? (
          <NoMajorGaps label="Trust coverage" />
        ) : (
          <ul className="list-disc space-y-1 pl-4 text-slate-300">
            {bundle.trust.coverageGaps.map((g) => (
              <li key={g.patternId}>
                <span className="text-slate-200">{g.patternId}</span>: {g.gap}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Ops simplification">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-slate-300">Duplicate panels</p>
            {bundle.ops.duplicatePanels.length === 0 ? (
              <NoMajorGaps label="Duplicate panels" />
            ) : (
              <ul className="list-disc pl-4 text-slate-400">
                {bundle.ops.duplicatePanels.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-300">Missing shortcuts</p>
            {bundle.ops.missingShortcuts.length === 0 ? (
              <NoMajorGaps label="Shortcuts" />
            ) : (
              <ul className="list-disc pl-4 text-slate-400">
                {bundle.ops.missingShortcuts.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-300">Consolidation ideas</p>
            {bundle.ops.consolidationSuggestions.length === 0 ? (
              <NoMajorGaps label="Consolidation" />
            ) : (
              <ul className="list-disc pl-4 text-slate-400">
                {bundle.ops.consolidationSuggestions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section title="Data moat opportunities">
        {bundle.dataMoat.strongestMoatCandidates.length === 0 ? (
          <NoMajorGaps label="Moat candidates" />
        ) : (
          <>
            <p className="font-medium text-slate-300">Strongest candidates</p>
            <ul className="list-disc pl-4 text-slate-400">
              {bundle.dataMoat.strongestMoatCandidates.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        )}
      </Section>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "amber" | "emerald" | "muted";
}) {
  const c =
    tone === "amber"
      ? "text-amber-100"
      : tone === "emerald"
        ? "text-emerald-200"
        : tone === "muted"
          ? "text-zinc-400"
          : "text-slate-100";
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
      <div className="text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${c}`}>{value}</div>
    </div>
  );
}
