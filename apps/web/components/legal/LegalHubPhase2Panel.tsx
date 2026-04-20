"use client";

import { useState } from "react";
import { LegalDocumentList } from "./LegalDocumentList";
import { LegalSubmitWorkflowButton } from "./LegalSubmitWorkflowButton";
import type { LegalUploadWorkflowOption } from "./LegalUploadCard";
import { LegalUploadCard } from "./LegalUploadCard";

type Props = {
  userId: string | null;
  actorType: string;
  showUpload: boolean;
  showDocuments: boolean;
  showWorkflowSubmit: boolean;
  defaultWorkflowType: string;
  uploadWorkflows: LegalUploadWorkflowOption[];
};

/**
 * User-side Legal Hub Phase 2 — upload, list, and explicit workflow submission.
 * All network calls are server-gated; UI is non-authoritative.
 */
export function LegalHubPhase2Panel({
  userId,
  actorType,
  showUpload,
  showDocuments,
  showWorkflowSubmit,
  defaultWorkflowType,
  uploadWorkflows,
}: Props) {
  const [refresh, setRefresh] = useState(0);
  const [submitWorkflowType, setSubmitWorkflowType] = useState(defaultWorkflowType);

  if (!userId) {
    return (
      <section className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/90">
        <p className="font-semibold text-amber-200/95">Account required</p>
        <p className="text-xs text-amber-100/80">
          Sign in to upload documents and request operator review. This area is for platform workflow tracking only — not
          legal advice.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Legal workflow submissions">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Submissions &amp; review</h2>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Uploads are reviewed by qualified platform operators. There is no automatic approval. This is not a substitute
          for your own professional advice.
        </p>
      </div>
      {showUpload ? (
        <LegalUploadCard
          actorType={actorType}
          workflows={uploadWorkflows}
          enabled={uploadWorkflows.length > 0}
          onUploaded={() => setRefresh((n) => n + 1)}
        />
      ) : null}
      {showDocuments ? (
        <LegalDocumentList enabled refreshToken={refresh} workflowTypeFilter={null} />
      ) : null}
      {showWorkflowSubmit ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <label className="block text-xs font-medium text-[#D1D5DB]">
            Workflow to submit for review
            <select
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              value={submitWorkflowType}
              onChange={(ev) => setSubmitWorkflowType(ev.target.value)}
            >
              {uploadWorkflows.map((w) => (
                <option key={w.workflowType} value={w.workflowType}>
                  {w.title}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-xs text-[#9CA3AF]">
            When every checklist item has an attachment, send the workflow bundle for broker/admin review.
          </p>
          <div className="mt-3">
            <LegalSubmitWorkflowButton
              workflowType={submitWorkflowType}
              actorType={actorType}
              enabled={uploadWorkflows.some((w) => w.workflowType === submitWorkflowType)}
              onSubmitted={() => setRefresh((n) => n + 1)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
