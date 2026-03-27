"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdditionalDeclarationHistoryEntry, SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";
import { newAdditionalDeclarationEntryId } from "@/lib/fsbo/seller-declaration-schema";

const RELATED_TAG_OPTIONS: { id: string; label: string }[] = [
  { id: "renovations", label: "Renovations" },
  { id: "condition", label: "Water damage / condition" },
  { id: "inspection", label: "Inspection" },
  { id: "pool", label: "Swimming pool" },
  { id: "condo", label: "Condo / syndicate" },
  { id: "newConstruction", label: "New construction / GCR" },
  { id: "inclusions", label: "Inclusions / exclusions" },
  { id: "description", label: "Property description" },
];

const PLACEHOLDER = `Provide details such as:

- explanations of previous answers
- past issues (fire, flooding, infestation, etc.)
- information received from previous owners
- work done or problems corrected
- any factor not covered in other sections`;

function validateDraft(d: SellerDeclarationData): string | null {
  if (!d.additionalDeclarationsLegalAck) {
    return "Confirm the legal declaration before saving this entry.";
  }
  const t = d.additionalDeclarationsText.trim();
  if (d.additionalDeclarationsInsufficientKnowledge) {
    if (t.length < 20) {
      return "You indicated limited knowledge — explain which answers are incomplete or unknown (at least a short paragraph).";
    }
  } else if (t.length < 10) {
    return "Enter sufficient detail in the text area (at least a few sentences), or check “insufficient knowledge” and explain.";
  }
  return null;
}

export function AdditionalDeclarationsFields({
  value,
  patch,
  listingId,
}: {
  value: SellerDeclarationData;
  patch: (partial: Partial<SellerDeclarationData>) => void;
  listingId: string | null;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ id: string; originalFileName: string }[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const loadDocs = useCallback(async () => {
    if (!listingId) {
      setDocs([]);
      return;
    }
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/fsbo/listings/${listingId}/seller-documents`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDocs([]);
        return;
      }
      const list = Array.isArray(data.documents) ? data.documents : [];
      setDocs(list.map((x: { id?: string; originalFileName?: string }) => ({ id: String(x.id), originalFileName: String(x.originalFileName ?? "file") })));
    } catch {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  function toggleTag(id: string) {
    const cur = value.additionalDeclarationsRelatedSectionKeys ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    patch({ additionalDeclarationsRelatedSectionKeys: next });
  }

  function toggleDocAttach(docId: string) {
    const cur = value.additionalDeclarationsAttachedDocumentIds ?? [];
    const next = cur.includes(docId) ? cur.filter((x) => x !== docId) : [...cur, docId];
    patch({ additionalDeclarationsAttachedDocumentIds: next });
  }

  function saveEntry() {
    setSaveOk(null);
    const err = validateDraft(value);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    const entry: AdditionalDeclarationHistoryEntry = {
      id: newAdditionalDeclarationEntryId(),
      createdAt: new Date().toISOString(),
      text: value.additionalDeclarationsText.trim(),
      insufficientKnowledge: value.additionalDeclarationsInsufficientKnowledge,
      relatedSectionKeys: [...(value.additionalDeclarationsRelatedSectionKeys ?? [])],
      attachedDocumentIds: [...(value.additionalDeclarationsAttachedDocumentIds ?? [])],
      legalAck: value.additionalDeclarationsLegalAck,
    };
    patch({
      additionalDeclarationsHistory: [...(value.additionalDeclarationsHistory ?? []), entry],
      additionalDeclarationsText: "",
      additionalDeclarationsInsufficientKnowledge: false,
      additionalDeclarationsRelatedSectionKeys: [],
      additionalDeclarationsAttachedDocumentIds: [],
      additionalDeclarationsLegalAck: false,
    });
    setSaveOk("Declaration entry saved. You can add another update below at any time.");
  }

  const history = [...(value.additionalDeclarationsHistory ?? [])].reverse();

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Provide clarifications and disclose any additional relevant information about the property
      </p>

      <div className="rounded-lg border border-white/10 bg-[#141414] p-4 text-sm leading-relaxed text-slate-300">
        <p className="font-medium text-slate-200">This section allows you to:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
          <li>clarify your answers in previous sections</li>
          <li>explain unknown or incomplete information</li>
          <li>disclose any additional factors affecting the property</li>
          <li>provide transparency to all parties</li>
        </ul>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Visibility:</span> Seller declarations are shown to buyers,
        brokers, inspectors, and lenders where this listing is shared —{" "}
        <span className="text-amber-200/90">Seller declarations (unverified — subject to verification)</span>.
      </p>

      <label className="block text-sm text-slate-300">
        <span className="mb-1 block font-medium text-white">Details &amp; clarifications</span>
        <textarea
          value={value.additionalDeclarationsText}
          onChange={(e) => {
            setLocalError(null);
            patch({ additionalDeclarationsText: e.target.value });
          }}
          rows={10}
          placeholder={PLACEHOLDER}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 font-sans text-sm text-white placeholder:text-slate-600"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="mt-1 rounded border-white/20"
          checked={value.additionalDeclarationsInsufficientKnowledge}
          onChange={(e) => {
            setLocalError(null);
            patch({ additionalDeclarationsInsufficientKnowledge: e.target.checked });
          }}
        />
        <span>I do not have sufficient knowledge for some answers (you must explain in the text area above).</span>
      </label>

      <div>
        <p className="text-sm font-medium text-slate-200">Related to:</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Optional tags (e.g. Renovations, Water damage, Inspection). Select any that apply to this entry.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RELATED_TAG_OPTIONS.map((opt) => {
            const on = (value.additionalDeclarationsRelatedSectionKeys ?? []).includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setLocalError(null);
                  toggleTag(opt.id);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  on ? "border-[#C9A646] bg-[#C9A646]/15 text-[#E8D5A3]" : "border-white/15 text-slate-400 hover:border-white/25"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {listingId ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attach supporting documents</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Files from your seller document library for this listing (upload them in Seller Hub → Documents if needed).
          </p>
          {docsLoading ? (
            <p className="mt-2 text-xs text-slate-500">Loading documents…</p>
          ) : docs.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No documents uploaded yet for this listing.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-white/20"
                      checked={(value.additionalDeclarationsAttachedDocumentIds ?? []).includes(doc.id)}
                      onChange={() => toggleDocAttach(doc.id)}
                    />
                    <span className="min-w-0 break-words">{doc.originalFileName}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Save your listing draft first to attach documents from the document library.</p>
      )}

      <label className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-950/20 p-3 text-sm text-amber-100/95">
        <input
          type="checkbox"
          className="mt-1 rounded border-amber-500/40"
          checked={value.additionalDeclarationsLegalAck}
          onChange={(e) => {
            setLocalError(null);
            patch({ additionalDeclarationsLegalAck: e.target.checked });
          }}
        />
        <span>
          I confirm that:
          <br />- I answered to the best of my knowledge
          <br />- I disclosed all known adverse factors
          <br />- I included information from previous owners when applicable
        </span>
      </label>

      {localError ? <p className="text-sm text-red-400">{localError}</p> : null}
      {saveOk ? <p className="text-sm text-emerald-400">{saveOk}</p> : null}

      <button
        type="button"
        onClick={saveEntry}
        className="rounded-xl bg-[#C9A646] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#E8C547]"
      >
        Save declaration entry
      </button>
      <p className="text-[11px] text-slate-500">
        Each save adds a new timestamped entry (amendment-style). Prior entries are kept for the record.
      </p>

      {history.length > 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">History</p>
          <ul className="mt-3 space-y-4">
            {history.map((e) => (
              <li key={e.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <p className="text-[11px] text-slate-500">
                  Updated on:{" "}
                  <time dateTime={e.createdAt}>
                    {new Date(e.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{e.text}</p>
                {e.insufficientKnowledge ? (
                  <p className="mt-1 text-xs text-amber-200/90">Limited knowledge indicated for some items.</p>
                ) : null}
                {e.relatedSectionKeys.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Related:{" "}
                    {e.relatedSectionKeys
                      .map((k) => RELATED_TAG_OPTIONS.find((o) => o.id === k)?.label ?? k)
                      .join(", ")}
                  </p>
                ) : null}
                {e.attachedDocumentIds.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Attached:{" "}
                    {e.attachedDocumentIds
                      .map((id) => docs.find((d) => d.id === id)?.originalFileName ?? id)
                      .join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
          No entries saved yet. Additional declarations are required before you can complete the checklist — save at least one
          entry with the required text and confirmation.
        </p>
      )}
    </div>
  );
}
