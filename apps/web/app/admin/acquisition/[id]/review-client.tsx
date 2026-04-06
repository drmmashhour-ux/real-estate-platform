"use client";

import Link from "next/link";
import { useState } from "react";

export function AcquisitionLeadReviewClient({
  leadId,
  fsboId,
  fsboCode,
}: {
  leadId: string;
  fsboId: string | null;
  fsboCode: string | null;
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function postReview(action: string, extra?: Record<string, unknown>) {
    if (!fsboId) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/listing-acquisition/fsbo-review/${encodeURIComponent(fsboId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      setMsg(`OK — ${action}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!fsboId) {
    return (
      <p className="mt-8 text-sm text-white/50">
        No FSBO draft linked yet. Use <strong className="text-white/70">Convert → draft</strong> on the board, or create from{" "}
        <Link href="/admin/acquisition/quick-add" className="text-[#D4AF37] hover:underline">
          quick add
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-4 rounded border border-white/10 bg-[#0b0b0b] p-4">
      <h2 className="text-lg font-medium text-white">Linked FSBO draft</h2>
      <p className="text-sm text-white/60">
        Code: <code className="text-white/80">{fsboCode ?? fsboId}</code> ·{" "}
        <Link href={`/admin/fsbo/${fsboId}`} className="text-[#D4AF37] hover:underline">
          Open in admin FSBO
        </Link>
      </p>
      {msg ? <p className="text-sm text-white/70">{msg}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-40"
          onClick={() =>
            void postReview("save", {
              rewrittenDescriptionReviewed: true,
              imagesApproved: true,
              permissionConfirmedAt: true,
            })
          }
        >
          Mark checklist (save)
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
          onClick={() => void postReview("approve_draft")}
        >
          Approve draft (not live)
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded bg-emerald-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-40"
          onClick={() => void postReview("publish")}
        >
          Approve & publish
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-40"
          onClick={() => void postReview("request_changes")}
        >
          Request changes
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-40"
          onClick={() => void postReview("reject", { rejectReason: "Did not meet safe publication requirements." })}
        >
          Reject / archive
        </button>
      </div>
      <p className="text-xs text-white/40">
        Lead id: {leadId} — publishing sets acquisition stage to Published when linked.
      </p>
    </div>
  );
}
