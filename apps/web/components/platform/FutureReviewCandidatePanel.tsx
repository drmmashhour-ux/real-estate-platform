"use client";

import { useCallback, useState } from "react";

import type { FutureReviewCandidate } from "@/modules/platform/ops-assistant/future-review-candidate.types";
import {
  FUTURE_REVIEW_REGISTRY_BACKLOG_LABEL,
  FUTURE_REVIEW_REGISTRY_CANNOT_ACTIVATE_RULE,
  FUTURE_REVIEW_REGISTRY_NOT_ACTIVE_MESSAGE,
} from "@/modules/platform/ops-assistant/future-review-candidate.types";

export function FutureReviewCandidatePanel({
  initialCandidates,
  mutationsEnabled,
}: {
  initialCandidates: FutureReviewCandidate[];
  mutationsEnabled: boolean;
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/ops-assistant/future-review-candidates");
      const json = (await res.json()) as { candidates?: FutureReviewCandidate[] };
      if (json.candidates) setCandidates(json.candidates);
    } catch {
      /* ignore */
    }
  }, []);

  const patch = async (id: string, action: "hold" | "reject" | "archive") => {
    setBusyId(`${id}:${action}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/platform/ops-assistant/future-review-candidates/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; candidates?: FutureReviewCandidate[] };
      if (!res.ok) {
        setMsg(json.error ?? "Update failed");
        return;
      }
      if (json.candidates) setCandidates(json.candidates);
      setMsg("Registry updated.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/15 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Future review candidate registry</h2>
      <p className="mt-1 text-[11px] text-slate-500">{FUTURE_REVIEW_REGISTRY_BACKLOG_LABEL}</p>

      <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100">
        {FUTURE_REVIEW_REGISTRY_NOT_ACTIVE_MESSAGE}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">{FUTURE_REVIEW_REGISTRY_CANNOT_ACTIVATE_RULE}</p>

      {msg ? <p className="mt-2 text-xs text-emerald-400">{msg}</p> : null}

      <div className="mt-4 space-y-3">
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No candidates yet — mark a governance row “Eligible for future review” or add one via API intake (POST).
          </p>
        ) : (
          candidates.map((c) => (
            <div key={c.id} className="rounded border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-cyan-200">{c.actionType}</span>
                <span className="text-[10px] uppercase text-slate-500">{c.currentStatus.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-300">{c.description}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Why low-risk / adjacent:</span> {c.whyAdjacentLowRisk}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Evidence:</span>{" "}
                {c.evidenceSummary.headline ? `${c.evidenceSummary.headline} — ` : null}
                {c.evidenceSummary.narrative.length > 320
                  ? `${c.evidenceSummary.narrative.slice(0, 320)}…`
                  : c.evidenceSummary.narrative}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Audit health:</span> {c.auditHealthSummary}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">Reversibility:</span> {c.reversibility} ·{" "}
                <span className="font-semibold text-slate-400">Category:</span> {c.category.replace(/_/g, " ")}
              </p>
              {c.notes ? (
                <p className="mt-1 text-[10px] text-slate-600">
                  <span className="font-semibold text-slate-500">Notes:</span> {c.notes}
                </p>
              ) : null}

              {c.currentStatus === "archived" ? (
                <p className="mt-2 text-[10px] text-slate-600">
                  Archived — hidden from default list on refresh (registry only; never activated).
                </p>
              ) : c.currentStatus === "rejected" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <RegBtn
                    label="Archive"
                    disabled={Boolean(busyId) || !mutationsEnabled}
                    onClick={() => void patch(c.id, "archive")}
                  />
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <RegBtn
                    label="Hold"
                    disabled={Boolean(busyId) || !mutationsEnabled}
                    onClick={() => void patch(c.id, "hold")}
                  />
                  <RegBtn
                    label="Reject"
                    disabled={Boolean(busyId) || !mutationsEnabled}
                    onClick={() => void patch(c.id, "reject")}
                  />
                  <RegBtn
                    label="Archive"
                    disabled={Boolean(busyId) || !mutationsEnabled}
                    onClick={() => void patch(c.id, "archive")}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="mt-3 text-[10px] text-cyan-400 underline decoration-cyan-900 hover:text-cyan-300"
        onClick={() => void refresh()}
      >
        Refresh registry
      </button>
    </div>
  );
}

function RegBtn({
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
      className="rounded border border-cyan-900/60 bg-cyan-950/40 px-2 py-1 text-[10px] text-cyan-100 hover:bg-cyan-900/40 disabled:opacity-40"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
