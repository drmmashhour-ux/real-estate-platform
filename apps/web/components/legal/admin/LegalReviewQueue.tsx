"use client";

import { useCallback, useEffect, useState } from "react";
import { LegalReviewCard } from "./LegalReviewCard";
import { LegalReviewDecisionModal } from "./LegalReviewDecisionModal";

type PendingDoc = {
  id: string;
  userId: string | null;
  workflowType: string;
  requirementId: string;
  actorType: string;
  status: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  workflowSubmissionId: string | null;
};

type PendingWf = {
  id: string;
  userId: string | null;
  workflowType: string;
  actorType: string;
  status: string;
  submittedAt: string | null;
};

export function LegalReviewQueue() {
  const [docs, setDocs] = useState<PendingDoc[]>([]);
  const [workflows, setWorkflows] = useState<PendingWf[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<
    | { kind: "document"; id: string }
    | { kind: "workflow"; id: string }
    | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/legal/review", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        pendingDocuments?: PendingDoc[];
        pendingWorkflows?: PendingWf[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not load queue.");
        setDocs([]);
        setWorkflows([]);
        return;
      }
      setDocs(Array.isArray(data.pendingDocuments) ? data.pendingDocuments : []);
      setWorkflows(Array.isArray(data.pendingWorkflows) ? data.pendingWorkflows : []);
    } catch {
      setError("Could not load queue.");
      setDocs([]);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmReview(payload: { decision: "approve" | "reject"; reason?: string }) {
    if (!modal) return;

    const url =
      modal.kind === "document" ?
        "/api/admin/legal/review/document"
      : "/api/admin/legal/review/workflow";

    const body =
      modal.kind === "document" ?
        {
          documentId: modal.id,
          decision: payload.decision,
          ...(payload.decision === "reject" ? { reason: payload.reason } : {}),
        }
      : {
          workflowId: modal.id,
          decision: payload.decision,
          ...(payload.decision === "reject" ? { reason: payload.reason } : {}),
        };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Review failed.");
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-200">Legal Hub — operator queue</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs font-medium text-emerald-400 hover:underline"
        >
          Refresh
        </button>
      </div>
      {loading ? <p className="text-xs text-slate-500">Loading…</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow bundles</h3>
        <div className="mt-2 space-y-2">
          {workflows.length === 0 && !loading ? (
            <p className="text-xs text-slate-600">No workflows awaiting review.</p>
          ) : null}
          {workflows.map((w) => (
            <LegalReviewCard
              key={w.id}
              variant="workflow"
              title={w.workflowType}
              subtitle={`Actor ${w.actorType}`}
              meta={[
                `Submission ${w.submittedAt ?? "—"}`,
                w.userId ? `User ${w.userId}` : "User unset",
              ]}
              onReview={() => setModal({ kind: "workflow", id: w.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Standalone documents</h3>
        <p className="mt-1 text-[11px] text-slate-600">
          Items submitted outside an active workflow bundle (or after bundle resolution).
        </p>
        <div className="mt-2 space-y-2">
          {docs.length === 0 && !loading ? (
            <p className="text-xs text-slate-600">No standalone documents awaiting review.</p>
          ) : null}
          {docs.map((d) => (
            <LegalReviewCard
              key={d.id}
              variant="document"
              title={d.fileName}
              subtitle={`${d.workflowType} · ${d.requirementId}`}
              meta={[
                d.fileType,
                `Uploaded ${d.uploadedAt}`,
                d.userId ? `User ${d.userId}` : "User unset",
              ]}
              onReview={() => setModal({ kind: "document", id: d.id })}
            />
          ))}
        </div>
      </div>

      <LegalReviewDecisionModal
        open={modal !== null}
        kind={modal?.kind ?? "document"}
        title={modal?.kind === "workflow" ? "Workflow decision" : "Document decision"}
        onClose={() => setModal(null)}
        onConfirm={confirmReview}
      />
    </div>
  );
}
