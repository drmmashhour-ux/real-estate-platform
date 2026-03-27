"use client";

type DraftEvent = "negotiation_draft_copied" | "negotiation_draft_applied" | "negotiation_draft_rejected";

export function DraftActionsRow({
  listingId,
  documentId,
  draftKind,
  copyText,
  onCopied,
}: {
  listingId: string;
  documentId?: string | null;
  draftKind: string;
  copyText: string;
  onCopied?: () => void;
}) {
  async function emit(event: DraftEvent) {
    try {
      await fetch("/api/negotiation/draft-event", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, listingId, draftKind, documentId: documentId ?? undefined }),
      });
    } catch {
      /* ignore */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      await emit("negotiation_draft_copied");
      onCopied?.();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4 print:hidden">
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-lg border border-[#C9A646]/40 bg-[#C9A646]/10 px-3 py-1.5 text-xs font-semibold text-[#E8C547] hover:bg-[#C9A646]/20"
      >
        Copy text
      </button>
      <button
        type="button"
        onClick={() => void emit("negotiation_draft_applied")}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
      >
        Mark as used in file
      </button>
      <button
        type="button"
        onClick={() => void emit("negotiation_draft_rejected")}
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300"
      >
        Dismiss draft
      </button>
    </div>
  );
}
