"use client";

import { useState } from "react";
import type {
  AiCorrectionSuggestion,
  AiDraftInput,
  AiDraftOutput,
  AiRiskFinding,
} from "@/modules/ai-drafting-correction/types";
import { AiRiskReviewPanel } from "@/components/ai-draft/AiRiskReviewPanel";
import { AiSuggestionsPanel } from "@/components/ai-draft/AiSuggestionsPanel";

type Props = {
  draftId: string;
  /** Full Turbo payload — saved via /api/ai-draft/snapshot if needed */
  input: AiDraftInput;
  onImproved?: (out: AiDraftOutput) => void;
};

export function AiDraftToolbar({ draftId, input, onImproved }: Props) {
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const [findings, setFindings] = useState<AiRiskFinding[]>([]);
  const [status, setStatus] = useState<string | undefined>();
  const [suggestionList, setSuggestionList] = useState<AiCorrectionSuggestion[]>([]);
  const [genWarnings, setGenWarnings] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const payload = { ...input, draftId, userId: input.userId };

  const runReview = async () => {
    setLoadingReview(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai-draft/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, input: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Erreur revue");
        return;
      }
      setFindings(Array.isArray(data.findings) ? data.findings : []);
      setStatus(typeof data.turboDraftStatus === "string" ? data.turboDraftStatus : undefined);
    } finally {
      setLoadingReview(false);
    }
  };

  const runGenerate = async () => {
    setLoadingGen(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai-draft/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, input: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Erreur génération");
        return;
      }
      setFindings(Array.isArray(data.findings) ? data.findings : []);
      setStatus(typeof data.turboDraftStatus === "string" ? data.turboDraftStatus : undefined);
      setGenWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      if (typeof onImproved === "function") {
        onImproved({
          draftId,
          improvedSections: data.improvedSections ?? [],
          improvedHtml: data.improvedHtml,
          missingFactMarkers: data.missingFactMarkers ?? [],
          findings: data.findings ?? [],
          turboDraftStatus: data.turboDraftStatus ?? "READY_TO_SIGN",
          modelUsed: data.modelUsed ?? "deterministic",
          warnings: data.warnings ?? [],
        });
      }
    } finally {
      setLoadingGen(false);
    }
  };

  const runSuggestions = async () => {
    setLoadingSug(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai-draft/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, input: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Erreur suggestions");
        return;
      }
      setSuggestionList((Array.isArray(data.suggestions) ? data.suggestions : []) as AiCorrectionSuggestion[]);
      setFindings(Array.isArray(data.findings) ? data.findings : []);
    } finally {
      setLoadingSug(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-premium-gold/30 bg-black/80 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loadingReview}
          onClick={() => void runReview()}
          className="rounded-lg border border-premium-gold/50 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10 disabled:opacity-40"
        >
          {loadingReview ? "Revue…" : "Revue IA du brouillon"}
        </button>
        <button
          type="button"
          disabled={loadingGen}
          onClick={() => void runGenerate()}
          className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:bg-[#E8D5A0] disabled:opacity-40"
        >
          {loadingGen ? "Amélioration…" : "Améliorer le brouillon (IA)"}
        </button>
        <button
          type="button"
          disabled={loadingSug}
          onClick={() => void runSuggestions()}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40"
        >
          {loadingSug ? "Suggestions…" : "Suggestions"}
        </button>
      </div>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {genWarnings.length > 0 ? (
        <ul className="text-xs text-amber-200">
          {genWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <AiRiskReviewPanel findings={findings} turboDraftStatus={status} loading={loadingReview && !findings.length} />
      {suggestionList.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Suggestions actionnables</h4>
          <AiSuggestionsPanel
            suggestions={suggestionList as import("@/modules/ai-drafting-correction/types").AiCorrectionSuggestion[]}
          />
        </div>
      ) : null}
      <p className="text-xs text-slate-500">
        Les avis légaux, Contract Brain et la signature restent contrôlés par leurs propres barrières — l’IA ne peut pas les
        contourner.
      </p>
    </div>
  );
}
