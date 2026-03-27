"use client";

import { useMemo, useState } from "react";
import type { CounterProposalDraftOutput } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";
import { DraftConfidence } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.enums";
import { DraftActionsRow } from "@/src/modules/ai-negotiation-deal-intelligence/ui/DraftActionsRow";

function confidenceBadge(c: DraftConfidence): { label: string; className: string } {
  if (c === DraftConfidence.Low) return { label: "Low confidence", className: "border-rose-500/40 bg-rose-500/10 text-rose-100" };
  if (c === DraftConfidence.Medium) return { label: "Medium confidence", className: "border-amber-500/40 bg-amber-500/10 text-amber-100" };
  return { label: "Higher confidence", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" };
}

export function CounterProposalDraftCard({
  listingId,
  documentId,
}: {
  listingId: string;
  documentId?: string | null;
}) {
  const [draft, setDraft] = useState<CounterProposalDraftOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const copyPayload = useMemo(() => {
    if (!draft) return "";
    return [
      draft.summary,
      "",
      "Requested changes:",
      ...draft.requestedChanges.map((x) => `- ${x}`),
      "",
      "Protections:",
      ...draft.protections.map((x) => `- ${x}`),
      "",
      "Follow-up:",
      ...draft.followUpRequests.map((x) => `- ${x}`),
      "",
      "Rationale (internal):",
      draft.rationale,
      "",
      draft.disclaimer,
    ].join("\n");
  }, [draft]);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/negotiation/counter-draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: listingId, documentId: documentId ?? undefined }),
      });
      const j = (await res.json()) as { draft?: CounterProposalDraftOutput; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not generate draft");
        return;
      }
      setDraft(j.draft ?? null);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  const badge = draft ? confidenceBadge(draft.confidence) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-6 shadow-xl ring-1 ring-white/5 print:border-neutral-400 print:bg-white print:text-black print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646] print:text-neutral-800">Counter-proposal draft</p>
          <p className="mt-2 text-xs text-slate-500 print:text-neutral-600">
            Review before use — nothing is sent automatically. Edit all figures and terms.
          </p>
        </div>
        {badge ? (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}>{badge.label}</span>
        ) : null}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void generate()}
        className="mt-4 rounded-full border border-[#C9A646]/50 bg-[#C9A646]/10 px-5 py-2 text-xs font-semibold text-[#C9A646] transition hover:bg-[#C9A646]/20 disabled:opacity-50 print:hidden"
      >
        {loading ? "Generating…" : "Generate draft"}
      </button>
      {err ? <p className="mt-2 text-xs text-red-300 print:text-red-800">{err}</p> : null}
      {draft ? (
        <div className="mt-5 space-y-4 text-sm text-slate-300 print:text-neutral-900">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Summary</p>
            <p className="mt-1 leading-relaxed whitespace-pre-wrap">{draft.summary}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Requested changes</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {draft.requestedChanges.map((x) => (
                <li key={x.slice(0, 56)}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Protections</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {draft.protections.map((x) => (
                <li key={x.slice(0, 56)}>{x}</li>
              ))}
            </ul>
          </div>
          {draft.followUpRequests.length ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 print:text-neutral-600">Follow-up requests</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {draft.followUpRequests.map((x) => (
                  <li key={x.slice(0, 56)}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {draft.missingFacts.length ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 print:border-amber-900/30">
              <p className="text-[11px] font-medium uppercase text-amber-200/90 print:text-neutral-800">Missing or unverified facts</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/90 print:text-neutral-900">
                {draft.missingFacts.map((x) => (
                  <li key={x.slice(0, 56)}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="rounded-xl border border-dashed border-slate-600/50 bg-black/30 p-3 print:border-neutral-400">
            <p className="text-[11px] font-medium uppercase text-slate-500 print:text-neutral-600">Sources (grounding)</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400 print:text-neutral-800">
              {draft.sourceRefs.map((r) => (
                <li key={r.id}>
                  <span className="text-slate-300 print:text-neutral-900">{r.label}</span>
                  {r.detail ? <span className="text-slate-500"> — {r.detail}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3 print:border-neutral-400">
            <p className="text-[11px] font-medium uppercase text-amber-200/90 print:text-neutral-800">Internal rationale</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/90 print:text-neutral-900">{draft.rationale}</p>
          </div>
          <p className="text-xs text-slate-500 print:text-neutral-700">{draft.disclaimer}</p>
          <DraftActionsRow listingId={listingId} documentId={documentId} draftKind="counter_proposal" copyText={copyPayload} />
        </div>
      ) : null}
    </div>
  );
}
