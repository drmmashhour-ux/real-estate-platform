"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AISuggestionCard } from "./AISuggestionCard";
import type { HostAiSuggestion } from "@/lib/host/dashboard-data";

const GOLD = "#D4AF37";

export function HostAiSuggestionsSection({ suggestions }: { suggestions: HostAiSuggestion[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function dismiss(suggestionId: string) {
    setBusy(suggestionId);
    try {
      const r = await fetch(`/api/ai/suggestions/${suggestionId}/dismiss`, { method: "POST" });
      if (r.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function apply(suggestionId: string) {
    setBusy(suggestionId);
    try {
      const r = await fetch(`/api/ai/suggestions/${suggestionId}/apply`, { method: "POST" });
      if (r.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {suggestions.map((s) => (
        <div key={s.id} className="space-y-2">
          <AISuggestionCard
            title={s.title}
            body={s.body}
            actionLabel={s.suggestionId ? undefined : s.actionLabel}
            href={s.suggestionId ? undefined : s.href}
          />
          {s.confidence != null ? (
            <p className="text-[11px] text-zinc-500">
              Suggested by AI · Confidence: {s.confidence >= 0.7 ? "High" : s.confidence >= 0.45 ? "Medium" : "Low"}
            </p>
          ) : null}
          {s.suggestionId ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === s.suggestionId}
                onClick={() => apply(s.suggestionId!)}
                className="rounded-lg border border-emerald-600/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40"
              >
                {busy === s.suggestionId ? "…" : "Apply suggestion"}
              </button>
              <Link
                href={s.href ?? "/host/pricing"}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                style={{ borderColor: `${GOLD}66` }}
              >
                Review details
              </Link>
              <button
                type="button"
                disabled={busy === s.suggestionId}
                onClick={() => dismiss(s.suggestionId!)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-900"
              >
                Dismiss
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
