"use client";

import { useState } from "react";
import type { AiRewriteInstruction } from "@/modules/ai-drafting-correction/types";
import { AiDiffViewer } from "@/components/ai-draft/AiDiffViewer";

type Props = {
  draftId: string;
  sectionKey: string;
  sourceText: string;
  instruction?: AiRewriteInstruction;
  onApplied?: () => void;
};

export function AiSectionRewriteButton({
  draftId,
  sectionKey,
  sourceText,
  instruction = "clarify",
  onApplied,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const runRewrite = async () => {
    setBusy(true);
    setErr(null);
    setBefore(sourceText);
    setAfter(null);
    try {
      const res = await fetch("/api/ai-draft/rewrite-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, sectionKey, instruction, sourceText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Échec");
        return;
      }
      setAfter(typeof data.rewrittenText === "string" ? data.rewrittenText : "");
    } finally {
      setBusy(false);
    }
  };

  const confirmApply = async () => {
    if (after == null) return;
    setBusy(true);
    try {
      await fetch("/api/ai-draft/rewrite-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          sectionKey,
          instruction,
          sourceText,
          applied: true,
        }),
      });
      onApplied?.();
      setBefore(null);
      setAfter(null);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await fetch("/api/ai-draft/rewrite-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, sectionKey, instruction, sourceText, applied: false }),
      });
    } finally {
      setBusy(false);
      setBefore(null);
      setAfter(null);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy || !sourceText.trim()}
        onClick={() => void runRewrite()}
        className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/20 disabled:opacity-40"
      >
        {busy ? "Réécriture…" : "Réécrire la section (IA)"}
      </button>
      {err ? <p className="text-xs text-red-400">{err}</p> : null}
      {before != null && after != null ? (
        <>
          <AiDiffViewer before={before} after={after} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmApply()}
              className="rounded-lg bg-premium-gold px-3 py-2 text-xs font-semibold text-black"
            >
              Approuver (journalisé)
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void reject()}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-slate-300"
            >
              Rejeter
            </button>
          </div>
          <p className="text-xs text-slate-500">
            L’application réelle du texte dans votre brouillon Turbo doit être faite par votre interface métier après
            approbation.
          </p>
        </>
      ) : null}
    </div>
  );
}
