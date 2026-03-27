"use client";

import { useState } from "react";
import type { DraftAnalysis } from "@/lib/contracts/draft-assistant-analyze";
import { AIAuditNotice } from "./AIAuditNotice";

type Props = {
  analysis: DraftAnalysis | null;
  busy: "idle" | "check" | "fix" | "improve";
  onCheckCompliance: () => void;
  onAutoFix: () => void;
  onImproveText: () => void;
  /** Optional: enable “AI wording” for a section (suggestions only — never auto-approved). */
  formAiContext?: { sectionTitle?: string; draftText?: string };
};

export function DraftingAssistantPanel({
  analysis,
  busy,
  onCheckCompliance,
  onAutoFix,
  onImproveText,
  formAiContext,
}: Props) {
  const loading = busy !== "idle";
  const [aiWording, setAiWording] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  async function runAiWording() {
    if (!formAiContext?.draftText?.trim()) return;
    setAiBusy(true);
    setAiWording(null);
    try {
      const res = await fetch("/api/ai/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          hub: "seller",
          feature: "legal_form_explain",
          intent: "draft",
          context: {
            sectionTitle: formAiContext.sectionTitle ?? "",
            draftText: formAiContext.draftText.slice(0, 8000),
          },
        }),
      });
      const j = await res.json().catch(() => ({}));
      setAiWording(typeof j.text === "string" ? j.text : "Unavailable.");
    } catch {
      setAiWording("AI unavailable — edit manually or try again.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#0a0a0a]">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#E8C547]">AI drafting assistant</h2>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          AI suggestions do not replace legal advice. Always have qualified counsel review binding documents.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <section className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            {analysis?.summary ?? "Run a compliance check to analyze this draft."}
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-red-400/90">Errors</h3>
          {analysis && analysis.errors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-red-300/95">
              {analysis.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Warnings</h3>
          {analysis && analysis.warnings.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-amber-200/90">
              {analysis.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None</p>
          )}
        </section>

        <section className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/80">Suggestions</h3>
          {analysis && analysis.suggestions.length > 0 ? (
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              {analysis.suggestions.map((s) => (
                <li key={s} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None yet — run compliance check.</p>
          )}
        </section>
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-950/40 px-3 py-2 text-[11px] leading-snug text-amber-100/90">
          AI suggestions do not replace legal advice.
        </p>
        {formAiContext?.draftText ? (
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold text-slate-400">AI wording (suggest only)</p>
            <AIAuditNotice variant="compact" emphasize />
            <button
              type="button"
              disabled={loading || aiBusy}
              onClick={() => void runAiWording()}
              className="mt-2 w-full rounded-xl border border-[#C9A646]/40 bg-[#C9A646]/10 px-3 py-2 text-xs font-semibold text-[#E8C547] hover:bg-[#C9A646]/20 disabled:opacity-50"
            >
              {aiBusy ? "Generating…" : "Suggest clearer wording"}
            </button>
            {aiWording ? (
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{aiWording}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCheckCompliance}
            className="rounded-xl bg-[#C9A646] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-50"
          >
            {busy === "check" ? "Checking…" : "Check compliance"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onAutoFix}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/10 disabled:opacity-50"
          >
            {busy === "fix" ? "Fixing…" : "Auto fix"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onImproveText}
            className="rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-[#C9A646] hover:bg-[#C9A646]/10 disabled:opacity-50"
          >
            {busy === "improve" ? "Improving…" : "Improve text"}
          </button>
        </div>
      </div>
    </aside>
  );
}
