"use client";

import { useState } from "react";
import type { AdminFormId } from "@/lib/ai/refill-admin-form";
import type { RefillSuggestions } from "@/lib/ai/refill-admin-form";

const FORM_ID_EVENT = "admin-form-ai-refill-apply";

export type AdminFormAiRefillProps = {
  formId: AdminFormId;
  className?: string;
};

export function AdminFormAiRefill({ formId, className = "" }: AdminFormAiRefillProps) {
  const [suggestions, setSuggestions] = useState<RefillSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefill() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const res = await fetch("/api/admin/ai/refill-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Request failed");
        return;
      }
      setSuggestions(data);
    } catch (e) {
      setError("Could not load suggestions");
    } finally {
      setLoading(false);
    }
  }

  function apply(s: RefillSuggestions) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(FORM_ID_EVENT, { detail: { formId, suggestions: s } })
    );
  }

  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-200">
            AI refill
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Let AI suggest values to speed up filling this form.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefill}
          disabled={loading}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {loading ? "Refilling…" : "AI refill"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}

      {suggestions && !error && (
        <div className="mt-4 space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
          {suggestions.message && (
            <p className="text-xs text-slate-500">{suggestions.message}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestions.newFlagKey && (
              <span className="rounded bg-slate-700 px-2 py-1 font-mono text-xs text-slate-200">
                {suggestions.newFlagKey}
              </span>
            )}
            {suggestions.newFlagReason && (
              <span className="text-xs text-slate-400">
                {suggestions.newFlagReason}
              </span>
            )}
            {suggestions.policyRuleKey && (
              <span className="rounded bg-slate-700 px-2 py-1 font-mono text-xs text-slate-200">
                {suggestions.policyRuleKey}
              </span>
            )}
            {suggestions.policyRuleName && (
              <span className="text-xs text-slate-400">
                {suggestions.policyRuleName}
              </span>
            )}
            {suggestions.searchHint && (
              <span className="text-xs text-slate-400">
                {suggestions.searchHint}
              </span>
            )}
            {suggestions.note && (
              <span className="text-xs text-slate-500">{suggestions.note}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => apply(suggestions)}
            className="rounded bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/30"
          >
            Apply to form
          </button>
        </div>
      )}
    </div>
  );
}

/** Call this from a form component to subscribe to AI refill apply events. */
export function useAdminFormRefillApply(
  formId: AdminFormId,
  onApply: (suggestions: RefillSuggestions) => void
) {
  if (typeof window === "undefined") return;
  const handler = (e: Event) => {
    const ev = e as CustomEvent<{ formId: string; suggestions: RefillSuggestions }>;
    if (ev.detail?.formId === formId && ev.detail?.suggestions) {
      onApply(ev.detail.suggestions);
    }
  };
  window.addEventListener(FORM_ID_EVENT, handler);
  return () => window.removeEventListener(FORM_ID_EVENT, handler);
}
