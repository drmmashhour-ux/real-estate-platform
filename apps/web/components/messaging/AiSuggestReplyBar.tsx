"use client";

import { useCallback, useState } from "react";

type Intent = "follow_up" | "property" | "negotiation";

type Props = {
  /** CRM conversation id */
  conversationId?: string | null;
  /** Listing-inquiry thread id */
  listingThreadId?: string | null;
  onApply: (text: string) => void;
};

export function AiSuggestReplyBar(props: Props) {
  const { conversationId, listingThreadId, onApply } = props;
  const [intent, setIntent] = useState<Intent>("follow_up");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ label: string; text: string }>>([]);
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const endpoint = conversationId
    ? `/api/conversations/${encodeURIComponent(conversationId)}/ai-suggestions`
    : listingThreadId
      ? `/api/messages/threads/${encodeURIComponent(listingThreadId)}/ai-suggestions`
      : null;

  const fetchSuggestions = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ intent }),
      });
      const j = (await res.json()) as {
        suggestions?: Array<{ label: string; text: string }>;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Could not generate suggestions");
      setOptions(Array.isArray(j.suggestions) ? j.suggestions.slice(0, 3) : []);
      setEdited({});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, intent]);

  if (!endpoint) return null;

  return (
    <div className="border-t border-emerald-500/20 bg-emerald-950/25 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">AI assistant</span>
        <select
          value={intent}
          onChange={(e) => setIntent(e.target.value as Intent)}
          className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-100"
        >
          <option value="follow_up">Follow-up</option>
          <option value="property">Property detail</option>
          <option value="negotiation">Negotiation</option>
        </select>
        <button
          type="button"
          disabled={loading}
          onClick={() => void fetchSuggestions()}
          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {loading ? "…" : "✨ Suggest reply"}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-rose-400">{err}</p> : null}
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Review before sending. Automated outreach respects frequency limits and consent preferences (Law 25).
      </p>
      {options.length > 0 ? (
        <div className="mt-3 space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <p className="text-[10px] font-semibold uppercase text-slate-400">{opt.label}</p>
              <textarea
                value={edited[i] ?? opt.text}
                onChange={(e) => setEdited((prev) => ({ ...prev, [i]: e.target.value }))}
                rows={3}
                className="mt-1 w-full resize-y rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-100"
              />
              <button
                type="button"
                onClick={() => onApply((edited[i] ?? opt.text).trim())}
                className="mt-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                Use in composer
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
