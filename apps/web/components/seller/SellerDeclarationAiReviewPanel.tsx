"use client";

import { useState } from "react";
import type { SellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review.logic";

export function SellerDeclarationAiReviewPanel({ review }: { review: SellerDeclarationAiReview | null }) {
  const [open, setOpen] = useState(true);

  if (!review) {
    return (
      <p className="text-xs text-slate-500">
        AI review runs when you save your declaration. Save progress to see suggestions here.
      </p>
    );
  }

  const hasRisks = review.detectedRisks.length > 0;
  const hasMissing = review.missingInformation.length > 0;
  const hasSuggestions = review.suggestions.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/25 bg-amber-950/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-amber-500/10"
      >
        <span className="text-sm font-semibold text-amber-100">AI Review of Your Declaration</span>
        <span className="text-xs text-amber-200/80">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-amber-500/20 px-4 pb-4 pt-2">
          <p className="text-[11px] text-slate-500">
            Automated scan (keywords + consistency checks).{" "}
            <span className="text-slate-400">This does not block publishing</span> — it helps you improve disclosure.
          </p>

          {review.hasHighRisk ? (
            <div className="rounded-lg border border-red-500/35 bg-red-950/30 px-3 py-2 text-sm text-red-100/95">
              <p className="font-medium text-red-50">⚠️ Important</p>
              <p className="mt-1 text-xs leading-relaxed text-red-100/90">
                You must ensure all relevant information is fully disclosed to avoid legal consequences. Review the items
                below and update your declaration or documents as needed.
              </p>
            </div>
          ) : null}

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">1. Detected risks</h4>
            {hasRisks ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {review.detectedRisks.map((r, i) => (
                  <li
                    key={i}
                    className={`flex gap-2 rounded-lg px-2 py-1.5 ${
                      r.severity === "HIGH" ? "bg-red-500/15 text-red-100" : "bg-amber-500/10 text-amber-50"
                    }`}
                  >
                    <span aria-hidden>⚠️</span>
                    <span>
                      <span className="text-[10px] font-semibold uppercase opacity-80">{r.severity}</span> — {r.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No high-risk keywords detected in this pass.</p>
            )}
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">2. Missing information</h4>
            {hasMissing ? (
              <ul className="mt-2 space-y-1.5 text-sm text-amber-50/95">
                {review.missingInformation.map((m, i) => (
                  <li key={i} className="flex gap-2 rounded-lg bg-amber-500/10 px-2 py-1.5">
                    <span aria-hidden>⚠️</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No obvious gaps flagged.</p>
            )}
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">3. Suggestions</h4>
            {hasSuggestions ? (
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {review.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-400">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <p className="text-[10px] text-slate-600">
            Last analyzed: {new Date(review.analyzedAt).toLocaleString()}
            {review.keywordsMatched.length > 0
              ? ` · Keywords matched: ${review.keywordsMatched.map((k) => k.label).join(", ")}`
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
