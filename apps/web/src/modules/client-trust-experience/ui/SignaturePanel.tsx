"use client";

import { useState } from "react";
import type { ClientDocumentTrustState } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

export function SignaturePanel({
  trustState,
  onSign,
}: {
  trustState: ClientDocumentTrustState | null;
  onSign: (name: string, email: string) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reviewedSections, setReviewedSections] = useState(false);
  const [busy, setBusy] = useState(false);

  const checklist = trustState?.signingChecklist;
  const docOk = checklist?.documentComplete ?? false;
  const blockersOk = checklist?.noBlockers ?? false;
  const ready = trustState?.readyToSign ?? false;

  const canSubmit =
    ready &&
    docOk &&
    blockersOk &&
    reviewedSections &&
    confirmed &&
    name.trim() &&
    email.trim() &&
    !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSign(name.trim(), email.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Sign</p>
      <p className="mt-1 text-xs text-slate-400">Complete the checklist before you sign. Signing means you agree you reviewed this document.</p>

      <ul className="mt-3 space-y-2 text-xs text-slate-300">
        <li className="flex items-start gap-2">
          <span className={docOk ? "text-emerald-400" : "text-slate-500"}>{docOk ? "✓" : "○"}</span>
          <span>Document looks complete (required fields filled).</span>
        </li>
        <li className="flex items-start gap-2">
          <span className={blockersOk ? "text-emerald-400" : "text-slate-500"}>{blockersOk ? "✓" : "○"}</span>
          <span>No blocking issues (contradictions or rule blocks).</span>
        </li>
        <li className="flex items-start gap-2">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={reviewedSections}
              onChange={(e) => setReviewedSections(e.target.checked)}
              className="mt-0.5"
            />
            <span>I reviewed the sections and used “Explain this” where I needed clarity.</span>
          </label>
        </li>
      </ul>

      <div className="mt-3 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
          placeholder="Signer name"
          autoComplete="name"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
          placeholder="Signer email"
          autoComplete="email"
        />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I confirm I read this document and understand I am not receiving legal advice from the platform.
        </label>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className="w-full rounded-md bg-[#C9A646] px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit signature"}
        </button>
        {!ready ? <p className="text-[11px] text-amber-200/90">Signing is available when the document passes validation checks.</p> : null}
      </div>
    </div>
  );
}
