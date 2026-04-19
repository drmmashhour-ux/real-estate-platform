"use client";

/**
 * Operator-only approval surface for the single adjacent internal trial — never customer-facing.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import type { GrowthAutonomyRolloutStage } from "@/modules/growth/growth-autonomy.types";
import type { GrowthAutonomyTrialSnapshot } from "@/modules/growth/growth-autonomy-trial.types";
import { ADJACENT_INTERNAL_TRIAL_ACTION_ID, ADJACENT_TRIAL_SCOPE_RULES } from "@/modules/growth/growth-autonomy-trial-boundaries";

export function GrowthAutonomyTrialApprovalPanel({
  trial,
  rolloutStage,
  viewerMayMutate,
}: {
  trial: GrowthAutonomyTrialSnapshot | undefined;
  rolloutStage: GrowthAutonomyRolloutStage;
  viewerMayMutate: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  if (!trial?.trialLayerEnabled) return null;

  async function postDecision(decision: "approve" | "deny" | "rollback") {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/growth/autonomy/trial", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          trialActionId: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
          evidenceSummary: trial?.explanation.evidenceSummary,
          notes: decision === "approve" ? "Approved via Growth autonomy trial panel" : undefined,
        }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Request failed");
      setMsg(decision === "approve" ? "Approved — activation runs on next snapshot build when gates pass." : `OK (${decision})`);
      window.location.reload();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const active = trial.approval?.activationStatus === "active";
  const pending = trial.approval?.activationStatus === "approved_internal_trial";

  return (
    <section
      className="mt-4 rounded-xl border border-violet-900/40 bg-violet-950/15 p-4"
      aria-label="Adjacent internal trial approval"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">Internal low-risk trial (single slot)</p>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
        Bounded adjacent action only — prepares an internal audit-visible draft marker. No CRM writes, outbound messages,
        payments, bookings core, ads core, or CRO core.
      </p>

      <ul className="mt-2 list-inside list-disc space-y-0.5 text-[10px] text-zinc-500">
        {ADJACENT_TRIAL_SCOPE_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      {rolloutStage !== "internal" ? (
        <p className="mt-3 text-[11px] text-amber-200/90">
          Trial activation requires rollout <code className="rounded bg-black/40 px-1">internal</code> — current:{" "}
          <span className="font-mono">{rolloutStage}</span>.
        </p>
      ) : null}

      {trial.trialFreezeActive ? (
        <p className="mt-2 text-[11px] text-amber-200/90">
          Trial freeze is on — no new approvals until FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE is cleared.
        </p>
      ) : null}

      <p className="mt-3 text-[11px] text-zinc-300">
        <span className="font-semibold text-zinc-200">Eligibility:</span> {trial.eligibilityOutcome.replace(/_/g, " ")} —{" "}
        {trial.explanation.whyEligibleOrNot}
      </p>

      {trial.selectedCandidate ? (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-black/25 p-2 text-[11px] text-zinc-400">
          <p className="font-semibold text-zinc-200">Candidate</p>
          <p className="mt-1">{trial.selectedCandidate.explanation}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">
            id={trial.selectedCandidate.id} · enf={trial.selectedCandidate.enforcementResult.mode} · evidence score≈
            {trial.selectedCandidate.evidenceQualityScore.toFixed(2)}
          </p>
        </div>
      ) : null}

      {trial.approval ?
        <div className="mt-3 rounded-lg border border-emerald-900/35 bg-emerald-950/15 p-2 text-[11px]">
          <p className="font-semibold text-emerald-100">Trial record</p>
          <p className="mt-1 text-emerald-100/85">
            Status: <span className="font-mono">{trial.approval.activationStatus}</span>
            {trial.approval.executionArtifactId ?
              <>
                {" "}
                · artifact <span className="font-mono">{trial.approval.executionArtifactId}</span>
              </>
            : null}
          </p>
          <p className="mt-1 text-zinc-500">
            Approved by {trial.approval.approvedBy ?? "—"} at {trial.approval.approvedAt ?? "—"}
          </p>
        </div>
      : null}

      {trial.activationBlockedReason ?
        <p className="mt-2 text-[11px] text-amber-200/85">Blocked: {trial.activationBlockedReason}</p>
      : null}

      {active ?
        <p className="mt-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-2 text-[11px] text-emerald-100">
          Internal low-risk trial active — artifact exists in autonomy audit trail only. Roll back to clear operator-visible
          trial state.
        </p>
      : null}

      {pending && !active ?
        <p className="mt-3 text-[11px] text-sky-100/90">
          Approved pending activation — the next autonomy snapshot build will record the draft marker when enforcement gates
          stay green.
        </p>
      : null}

      {viewerMayMutate ?
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              busy ||
              trial.trialFreezeActive ||
              rolloutStage !== "internal" ||
              active ||
              pending ||
              trial.eligibilityOutcome !== "eligible_for_internal_trial"
            }
            className="rounded-lg border border-violet-700 bg-violet-950/40 px-3 py-1.5 text-[11px] font-medium text-violet-100 disabled:opacity-40"
            onClick={() => void postDecision("approve")}
          >
            Approve internal trial
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300"
            onClick={() => void postDecision("deny")}
          >
            Deny / clear
          </button>
          <button
            type="button"
            disabled={busy || (!active && !pending)}
            className="rounded-lg border border-rose-800/50 px-3 py-1.5 text-[11px] text-rose-100 disabled:opacity-40"
            onClick={() => void postDecision("rollback")}
          >
            Roll back
          </button>
        </div>
      : (
        <p className="mt-3 text-[11px] text-zinc-500">Read-only — admin or internal pilot required to approve trials.</p>
      )}

      {msg ? <p className="mt-2 text-[11px] text-zinc-400">{msg}</p> : null}
    </section>
  );
}
