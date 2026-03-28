"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { LegalAiDisclaimer } from "@/components/legal/LegalAiDisclaimer";
import { BUYER_ACKNOWLEDGMENT_HTML, MORTGAGE_DISCLOSURE_HTML } from "@/modules/legal/form-content";
import { LEGAL_FORM_KEYS } from "@/modules/legal/legal-engine";
import { LEGAL_FORM_VERSION } from "@/modules/legal/form-versions";

type Kind = "buyer" | "mortgage";

const COPY: Record<Kind, { title: string; html: string; formKey: string; contextType: string }> = {
  buyer: {
    title: "Complete buyer acknowledgment",
    html: BUYER_ACKNOWLEDGMENT_HTML,
    formKey: LEGAL_FORM_KEYS.BUYER_ACKNOWLEDGMENT,
    contextType: "buyer_hub",
  },
  mortgage: {
    title: "Mortgage disclosure",
    html: MORTGAGE_DISCLOSURE_HTML,
    formKey: LEGAL_FORM_KEYS.MORTGAGE_DISCLOSURE,
    contextType: "mortgage_hub",
  },
};

type Props = {
  open: boolean;
  kind: Kind;
  onClose: () => void;
  /** Called after successful signature POST */
  onComplete: () => void;
};

export function LegalAcknowledgmentModal({ open, kind, onClose, onComplete }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const c = COPY[kind];

  if (!open) return null;

  async function explainContract() {
    setExplainBusy(true);
    setExplainText(null);
    try {
      const r = await fetch("/api/legal/ai/explain-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ kind }),
      });
      const j = (await r.json()) as { text?: string; error?: string };
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not explain");
      setExplainText(typeof j.text === "string" ? j.text : "");
    } catch (e) {
      setExplainText(e instanceof Error ? e.message : "Failed");
    } finally {
      setExplainBusy(false);
    }
  }

  async function accept() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/legal/sign-form", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formKey: c.formKey,
          contextType: c.contextType,
          contextId: "",
          version: LEGAL_FORM_VERSION,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not save acknowledgment");
      onComplete();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-gate-title"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-500/30 bg-[#121212] p-6 shadow-2xl">
        <h2 id="legal-gate-title" className="text-lg font-semibold text-white">
          {c.title}
        </h2>
        <p className="mt-2 text-xs text-amber-200/90">
          You must complete required forms before continuing. This is not legal advice — consult a professional for your
          situation.
        </p>
        <button
          type="button"
          disabled={explainBusy}
          onClick={() => void explainContract()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          {explainBusy ? "Explaining…" : "Explain this contract"}
        </button>
        {explainText ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-slate-200">
            <p className="font-medium text-white">AI summary</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-300">{explainText}</p>
            <div className="mt-2">
              <LegalAiDisclaimer />
            </div>
          </div>
        ) : null}
        <div
          className="legal-html mt-4 text-sm"
          dangerouslySetInnerHTML={{ __html: c.html }}
        />
        {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white hover:bg-white/5"
            disabled={busy}
            onClick={() => !busy && onClose()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-premium-gold py-3 text-sm font-bold text-black disabled:opacity-50"
            disabled={busy}
            onClick={() => void accept()}
          >
            {busy ? "Saving…" : "Accept & continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
