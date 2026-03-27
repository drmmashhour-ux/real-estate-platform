"use client";

import { useState } from "react";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";
import { AutoDraftDocumentType } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import { DraftSuggestionCard } from "@/src/modules/ai-auto-drafting/ui/DraftSuggestionCard";
import { DraftFollowUpPanel } from "@/src/modules/ai-auto-drafting/ui/DraftFollowUpPanel";
import { ApplyDraftSuggestionButton } from "@/src/modules/ai-auto-drafting/ui/ApplyDraftSuggestionButton";

type Props = {
  documentId: string;
  sectionKey: string;
  templateId?: string;
  facts: Record<string, unknown>;
  onApplyText?: (text: string) => void;
};

export function AutoDraftingPanel({ documentId, sectionKey, templateId = "seller_declaration_v1", facts, onApplyText }: Props) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<StandardDraftOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSectionDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auto-drafting/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          templateId,
          sectionKey,
          documentType: AutoDraftDocumentType.SELLER_DECLARATION,
          facts,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      const { validation: _v, ...rest } = json;
      void _v;
      setDraft(rest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">Auto-drafting</p>
        <button
          type="button"
          onClick={runSectionDraft}
          disabled={loading || !sectionKey}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white disabled:opacity-40"
        >
          {loading ? "Generating…" : "Generate section draft"}
        </button>
      </div>
      <p className="text-[10px] text-slate-500">Template-first, retrieval-backed. No facts are invented — review before use.</p>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <DraftSuggestionCard draft={draft} />
      {draft?.followUpQuestions?.length ? (
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-500">Follow-ups</p>
          <DraftFollowUpPanel questions={draft.followUpQuestions} />
        </div>
      ) : null}
      {draft?.sourceRefs?.length ? (
        <div className="text-[10px] text-slate-500">
          {draft.sourceRefs.slice(0, 3).map((s) => (
            <p key={s.documentId + s.excerpt.slice(0, 12)}>{s.documentTitle} · p.{s.pageNumber ?? "—"}</p>
          ))}
        </div>
      ) : null}
      {draft?.suggestedText && onApplyText ? (
        <ApplyDraftSuggestionButton
          onApply={() => onApplyText(draft.suggestedText)}
          disabled={!draft.suggestedText}
        />
      ) : null}
    </div>
  );
}
