"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

import type { FutureReviewCandidateCategory } from "@/modules/platform/ops-assistant/future-review-candidate.types";
import {
  CHECKLIST_KEYS,
  CHECKLIST_LABELS,
  type ChecklistKey,
} from "@/modules/platform/ops-assistant/future-low-risk-proposal-shared";
import type { FutureLowRiskActionProposal } from "@/modules/platform/ops-assistant/future-low-risk-proposal.types";
import {
  PROPOSAL_ACCEPTANCE_NOT_ENABLED_MESSAGE,
  PROPOSALS_CANNOT_ACTIVATE_RULE,
} from "@/modules/platform/ops-assistant/future-low-risk-proposal.types";

const CATEGORIES: FutureReviewCandidateCategory[] = [
  "workflow",
  "drafting",
  "triage_tagging",
  "reminders",
  "configuration",
  "other",
];

export function FutureLowRiskProposalPanel({
  initialProposals,
  mutationsEnabled,
}: {
  initialProposals: FutureLowRiskActionProposal[];
  mutationsEnabled: boolean;
}) {
  const [proposals, setProposals] = useState(initialProposals);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [createTitle, setCreateTitle] = useState("");
  const [createActionType, setCreateActionType] = useState("");
  const [createCategory, setCreateCategory] = useState<FutureReviewCandidateCategory>("workflow");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/ops-assistant/future-low-risk-proposals");
      const json = (await res.json()) as { proposals?: FutureLowRiskActionProposal[] };
      if (json.proposals) setProposals(json.proposals);
    } catch {
      /* ignore */
    }
  }, []);

  const post = async (payload: Record<string, unknown>) => {
    setBusy(JSON.stringify(payload));
    setMsg(null);
    try {
      const res = await fetch("/api/platform/ops-assistant/future-low-risk-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        proposals?: FutureLowRiskActionProposal[];
      };
      if (!res.ok) {
        setMsg(json.error ?? "Request failed");
        return;
      }
      if (json.proposals) setProposals(json.proposals);
      setMsg("Saved.");
    } finally {
      setBusy(null);
    }
  };

  const draftForEdit = useMemo(() => proposals.filter((p) => p.currentStatus === "draft"), [proposals]);

  return (
    <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/15 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
        Future low-risk action proposals (template)
      </h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Standard intake before anything reaches the future-review registry. Same checklist for every idea.
      </p>

      <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100">
        {PROPOSAL_ACCEPTANCE_NOT_ENABLED_MESSAGE}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">{PROPOSALS_CANNOT_ACTIVATE_RULE}</p>

      {msg ? <p className="mt-2 text-xs text-emerald-400">{msg}</p> : null}

      <section className="mt-4 rounded border border-slate-800 bg-slate-950/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">New draft</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="block text-[10px] text-slate-500">
            Title
            <input
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              value={createTitle}
              disabled={!mutationsEnabled}
              onChange={(e) => setCreateTitle(e.target.value)}
            />
          </label>
          <label className="block text-[10px] text-slate-500">
            Proposed action type (identifier)
            <input
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-100"
              value={createActionType}
              disabled={!mutationsEnabled}
              onChange={(e) => setCreateActionType(e.target.value)}
              placeholder="e.g. summarizeInternalDraftDiff"
            />
          </label>
        </div>
        <label className="mt-2 block text-[10px] text-slate-500">
          Category
          <select
            className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            value={createCategory}
            disabled={!mutationsEnabled}
            onChange={(e) => setCreateCategory(e.target.value as FutureReviewCandidateCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={Boolean(busy) || !mutationsEnabled}
          className="mt-2 rounded border border-indigo-800 bg-indigo-950/50 px-3 py-1.5 text-[11px] text-indigo-100 hover:bg-indigo-900/50 disabled:opacity-40"
          onClick={() =>
            void post({
              action: "create",
              title: createTitle,
              proposedActionType: createActionType,
              category: createCategory,
            })
          }
        >
          Create draft
        </button>
      </section>

      <div className="mt-4 space-y-4">
        {proposals.length === 0 ? (
          <p className="text-sm text-slate-500">No proposals yet — create a draft above.</p>
        ) : (
          proposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              busy={busy}
              mutationsEnabled={mutationsEnabled}
              onPost={post}
            />
          ))
        )}
      </div>

      {draftForEdit.length > 0 ? (
        <p className="mt-3 text-[10px] text-slate-600">
          {draftForEdit.length} draft(s) — complete every field, pass the checklist, then submit. No activation occurs.
        </p>
      ) : null}

      <button
        type="button"
        className="mt-3 text-[10px] text-indigo-400 underline decoration-indigo-900 hover:text-indigo-300"
        onClick={() => void refresh()}
      >
        Refresh proposals
      </button>
    </div>
  );
}

function ProposalCard({
  proposal: p,
  busy,
  mutationsEnabled,
  onPost,
}: {
  proposal: FutureLowRiskActionProposal;
  busy: string | null;
  mutationsEnabled: boolean;
  onPost: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [local, setLocal] = useState(p);
  if (p.updatedAt !== local.updatedAt && p.currentStatus === local.currentStatus) {
    setLocal(p);
  }

  const setCheck = (key: ChecklistKey, v: boolean) => {
    setLocal((prev) => ({
      ...prev,
      reviewChecklist: { ...prev.reviewChecklist, [key]: v },
    }));
  };

  const saveDraft = () =>
    void onPost({
      action: "update",
      id: local.id,
      patch: {
        title: local.title,
        proposedActionType: local.proposedActionType,
        category: local.category,
        description: local.description,
        whyAdjacentToExistingLowRiskScope: local.whyAdjacentToExistingLowRiskScope,
        whyReversible: local.whyReversible,
        whyInternalOnly: local.whyInternalOnly,
        expectedOperatorBenefit: local.expectedOperatorBenefit,
        expectedSafetyProfile: local.expectedSafetyProfile,
        explicitNonGoals: local.explicitNonGoals,
        requiredEvidenceBeforeConsideration: local.requiredEvidenceBeforeConsideration,
        proposedRollbackMethod: local.proposedRollbackMethod,
        riskProfile: local.riskProfile,
        reviewChecklist: local.reviewChecklist,
        notes: local.notes,
      },
    });

  const field =
    (
      key: keyof Pick<
        FutureLowRiskActionProposal,
        | "title"
        | "proposedActionType"
        | "description"
        | "whyAdjacentToExistingLowRiskScope"
        | "whyReversible"
        | "whyInternalOnly"
        | "expectedOperatorBenefit"
        | "expectedSafetyProfile"
        | "explicitNonGoals"
        | "requiredEvidenceBeforeConsideration"
        | "proposedRollbackMethod"
        | "notes"
      >,
    ) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocal((prev) => ({ ...prev, [key]: val }));
    };

  const isDraft = local.currentStatus === "draft";

  return (
    <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-100">{p.title}</p>
          <p className="text-[10px] font-mono text-slate-400">{p.proposedActionType}</p>
        </div>
        <span className="text-[10px] uppercase text-slate-500">{local.currentStatus.replace(/_/g, " ")}</span>
      </div>

      {isDraft ? (
        <div className="mt-3 space-y-2">
          <label className="block text-[10px] text-slate-500">
            Title
            <input
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              value={local.title}
              disabled={!mutationsEnabled}
              onChange={field("title")}
            />
          </label>
          <label className="block text-[10px] text-slate-500">
            Proposed action type
            <input
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-100"
              value={local.proposedActionType}
              disabled={!mutationsEnabled}
              onChange={field("proposedActionType")}
            />
          </label>
          <label className="block text-[10px] text-slate-500">
            Category
            <select
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              value={local.category}
              disabled={!mutationsEnabled}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  category: e.target.value as FutureReviewCandidateCategory,
                }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <TextArea label="Description" value={local.description} onChange={field("description")} disabled={!mutationsEnabled} />
          <TextArea
            label="Why adjacent to existing low-risk scope"
            value={local.whyAdjacentToExistingLowRiskScope}
            onChange={field("whyAdjacentToExistingLowRiskScope")}
            disabled={!mutationsEnabled}
          />
          <TextArea label="Why reversible" value={local.whyReversible} onChange={field("whyReversible")} disabled={!mutationsEnabled} />
          <TextArea label="Why internal-only" value={local.whyInternalOnly} onChange={field("whyInternalOnly")} disabled={!mutationsEnabled} />
          <TextArea
            label="Expected operator benefit"
            value={local.expectedOperatorBenefit}
            onChange={field("expectedOperatorBenefit")}
            disabled={!mutationsEnabled}
          />
          <TextArea
            label="Expected safety profile"
            value={local.expectedSafetyProfile}
            onChange={field("expectedSafetyProfile")}
            disabled={!mutationsEnabled}
          />
          <TextArea label="Explicit non-goals" value={local.explicitNonGoals} onChange={field("explicitNonGoals")} disabled={!mutationsEnabled} />
          <TextArea
            label="Required evidence before consideration"
            value={local.requiredEvidenceBeforeConsideration}
            onChange={field("requiredEvidenceBeforeConsideration")}
            disabled={!mutationsEnabled}
          />
          <TextArea
            label="Proposed rollback method"
            value={local.proposedRollbackMethod}
            onChange={field("proposedRollbackMethod")}
            disabled={!mutationsEnabled}
          />
          <label className="block text-[10px] text-slate-500">
            Risk profile headline
            <input
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
              value={local.riskProfile.headline}
              disabled={!mutationsEnabled}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  riskProfile: { ...prev.riskProfile, headline: e.target.value },
                }))
              }
            />
          </label>
          <label className="block text-[10px] text-slate-500">
            Risk profile elaboration (optional)
            <textarea
              className="mt-0.5 min-h-[44px] w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
              value={local.riskProfile.elaboration ?? ""}
              disabled={!mutationsEnabled}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  riskProfile: { ...prev.riskProfile, elaboration: e.target.value },
                }))
              }
            />
          </label>
          <TextArea label="Notes" value={local.notes ?? ""} onChange={field("notes")} disabled={!mutationsEnabled} />

          <p className="text-[10px] font-semibold uppercase text-slate-500">Review checklist</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {CHECKLIST_KEYS.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-[10px] text-slate-400">
                <input
                  type="checkbox"
                  checked={local.reviewChecklist[k]}
                  disabled={!mutationsEnabled}
                  onChange={(e) => setCheck(k, e.target.checked)}
                />
                {CHECKLIST_LABELS[k]}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <MiniBtn label="Save draft" disabled={Boolean(busy) || !mutationsEnabled} onClick={saveDraft} />
            <MiniBtn
              label="Submit proposal"
              disabled={Boolean(busy) || !mutationsEnabled}
              onClick={() => void onPost({ action: "submit", id: local.id })}
            />
            <MiniBtn
              label="Reject"
              disabled={Boolean(busy) || !mutationsEnabled}
              onClick={() => void onPost({ action: "reject", id: local.id, reason: "Rejected while draft" })}
            />
            <MiniBtn
              label="Archive"
              disabled={Boolean(busy) || !mutationsEnabled}
              onClick={() => void onPost({ action: "archive", id: local.id })}
            />
          </div>
        </div>
      ) : (
        <ReadOnlyProposalBody p={local} />
      )}

      {!isDraft ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {local.currentStatus === "submitted" ? (
            <>
              <MiniBtn
                label="Begin review"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "begin_review", id: local.id })}
              />
              <MiniBtn
                label="Accept to registry"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "accept_registry", id: local.id })}
              />
              <MiniBtn
                label="Reject"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "reject", id: local.id, reason: "Rejected in triage" })}
              />
              <MiniBtn
                label="Archive"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "archive", id: local.id })}
              />
            </>
          ) : null}
          {local.currentStatus === "under_review" ? (
            <>
              <MiniBtn
                label="Accept to registry"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "accept_registry", id: local.id })}
              />
              <MiniBtn
                label="Reject"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "reject", id: local.id, reason: "Rejected after review" })}
              />
              <MiniBtn
                label="Archive"
                disabled={Boolean(busy) || !mutationsEnabled}
                onClick={() => void onPost({ action: "archive", id: local.id })}
              />
            </>
          ) : null}
          {local.currentStatus === "accepted_to_registry" ? (
            <MiniBtn
              label="Archive"
              disabled={Boolean(busy) || !mutationsEnabled}
              onClick={() => void onPost({ action: "archive", id: local.id })}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReadOnlyProposalBody({ p }: { p: FutureLowRiskActionProposal }) {
  return (
    <div className="mt-2 space-y-1 text-[11px] text-slate-400">
      <p className="text-slate-300">{p.description}</p>
      <dl className="grid gap-1">
        <div>
          <dt className="inline text-slate-500">Adjacent · </dt>
          <dd className="inline">{p.whyAdjacentToExistingLowRiskScope}</dd>
        </div>
        <div className="mt-2">
          <dt className="text-[10px] font-semibold text-slate-500">Checklist</dt>
          <dd className="mt-1 grid gap-0.5 sm:grid-cols-2">
            {CHECKLIST_KEYS.map((k) => (
              <span key={k} className={p.reviewChecklist[k] ? "text-emerald-400" : "text-rose-400"}>
                {p.reviewChecklist[k] ? "✓" : "✗"} {CHECKLIST_LABELS[k]}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      {p.notes ? (
        <p className="text-[10px] text-slate-600">
          <span className="font-semibold">Notes:</span> {p.notes}
        </p>
      ) : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}) {
  return (
    <label className="block text-[10px] text-slate-500">
      {label}
      <textarea
        className="mt-0.5 min-h-[52px] w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </label>
  );
}

function MiniBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded border border-indigo-900/70 bg-indigo-950/40 px-2 py-1 text-[10px] text-indigo-100 hover:bg-indigo-900/40 disabled:opacity-40"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
