"use client";

import { useMemo, useState } from "react";
import type { NegotiationMessageDraftOutput, NegotiationMessageDraftType } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";
import { DraftConfidence } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.enums";
import { DraftActionsRow } from "@/src/modules/ai-negotiation-deal-intelligence/ui/DraftActionsRow";

const KIND_OPTIONS: { value: NegotiationMessageDraftType; label: string }[] = [
  { value: "seller_clarification_request", label: "Seller — clarification" },
  { value: "buyer_guidance_note", label: "Buyer — guidance" },
  { value: "broker_internal_summary", label: "Broker — internal" },
  { value: "needs_more_documents_request", label: "Request documents" },
  { value: "inspection_recommended_message", label: "Inspection recommended" },
  { value: "document_review_recommended_message", label: "Document review recommended" },
];

function confidenceBadge(c: DraftConfidence): { label: string; className: string } {
  if (c === DraftConfidence.Low) return { label: "Low confidence", className: "border-rose-500/40 bg-rose-500/10 text-rose-100" };
  if (c === DraftConfidence.Medium) return { label: "Medium confidence", className: "border-amber-500/40 bg-amber-500/10 text-amber-100" };
  return { label: "Higher confidence", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" };
}

export function NegotiationMessageDraftPanel({
  listingId,
  documentId,
}: {
  listingId: string;
  documentId?: string | null;
}) {
  const [draftType, setDraftType] = useState<NegotiationMessageDraftType>("seller_clarification_request");
  const [draft, setDraft] = useState<NegotiationMessageDraftOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const copyPayload = useMemo(() => {
    if (!draft) return "";
    return [
      draft.subject ? `Subject: ${draft.subject}` : "",
      "",
      draft.message,
      "",
      "Key points:",
      ...draft.keyPoints.map((k) => `- ${k}`),
      "",
      "Assumptions:",
      ...draft.assumptions.map((k) => `- ${k}`),
      "",
      draft.disclaimer,
    ]
      .filter(Boolean)
      .join("\n");
  }, [draft]);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/negotiation/message-draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: listingId,
          documentId: documentId ?? undefined,
          draftType,
        }),
      });
      const j = (await res.json()) as { draft?: NegotiationMessageDraftOutput; error?: string };
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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-6 shadow-xl ring-1 ring-white/5 print:border-neutral-400 print:bg-white print:text-black">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Message draft</p>
          <p className="mt-2 text-xs text-slate-500">
            Choose a template, generate, then copy. No email or SMS is sent from LECIPM here.
          </p>
        </div>
        {badge ? (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}>{badge.label}</span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="text-xs text-slate-400">
          Draft type
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as NegotiationMessageDraftType)}
            className="ml-2 mt-1 block w-full max-w-md rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white sm:mt-0 sm:inline-block sm:w-auto print:border-neutral-400 print:bg-white print:text-black"
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void generate()}
          className="rounded-full border border-[#C9A646]/50 bg-[#C9A646]/10 px-5 py-2 text-xs font-semibold text-[#C9A646] hover:bg-[#C9A646]/20 disabled:opacity-50 print:hidden"
        >
          {loading ? "Generating…" : "Generate draft"}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
      {draft ? (
        <div className="mt-5 space-y-4 text-sm text-slate-300 print:text-neutral-900">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Type: <span className="font-semibold text-[#C9A646]">{draft.draftType.replace(/_/g, " ")}</span>
          </p>
          {draft.subject ? (
            <div>
              <p className="text-[11px] font-medium uppercase text-slate-500">Subject</p>
              <p className="mt-1 font-medium text-white">{draft.subject}</p>
            </div>
          ) : null}
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Message</p>
            <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-white/5 bg-black/40 p-4 text-xs leading-relaxed text-slate-200 print:border-neutral-300 print:bg-neutral-50 print:text-black">
              {draft.message}
            </pre>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Key points</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {draft.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Assumptions</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-400">
              {draft.assumptions.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
          {draft.missingFacts.length ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <p className="text-[11px] font-medium uppercase text-amber-200/90">Missing facts</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/90">
                {draft.missingFacts.map((x) => (
                  <li key={x.slice(0, 48)}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-500">Sources</p>
            <ul className="mt-2 space-y-1">
              {draft.sourceRefs.map((r) => (
                <li key={r.id}>
                  {r.label}
                  {r.detail ? ` — ${r.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">{draft.disclaimer}</p>
          <DraftActionsRow listingId={listingId} documentId={documentId} draftKind={`message:${draft.draftType}`} copyText={copyPayload} />
        </div>
      ) : null}
    </div>
  );
}
