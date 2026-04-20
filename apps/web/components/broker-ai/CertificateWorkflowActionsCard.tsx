"use client";

import { useState } from "react";

export function CertificateWorkflowActionsCard(props: {
  listingId: string;
  workflow?: {
    requestUpload: boolean;
    markReviewed: boolean;
    sendToAdmin: boolean;
  } | null;
}) {
  const wf = props.workflow;
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  if (!wf || !props.listingId.trim()) return null;
  if (!wf.requestUpload && !wf.markReviewed && !wf.sendToAdmin) return null;

  const run = async (action: "request_upload" | "mark_reviewed" | "admin_review") => {
    setPending(action);
    setStatus(null);
    try {
      const res = await fetch("/api/broker-ai/certificate-of-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: props.listingId, action }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; reason?: string } | null;
      if (!res.ok) {
        setStatus(typeof data?.reason === "string" ? data.reason : `Request failed (${res.status}).`);
      } else if (data?.ok) {
        setStatus("Recorded — refresh the page to reload structured signals.");
      } else {
        setStatus(typeof data?.reason === "string" ? data.reason : "Could not complete.");
      }
    } catch {
      setStatus("Network error.");
    } finally {
      setPending(null);
    }
  };

  const btn =
    "inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-40";

  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Broker actions</p>
      <p className="mt-1 text-[11px] text-zinc-500">
        Explicit audit entries — does not upload files or approve compliance automatically.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {wf.requestUpload ? (
          <button
            type="button"
            disabled={pending !== null}
            className={`${btn} border-amber-900/60 bg-amber-950/30 text-amber-100 hover:bg-amber-950/50`}
            onClick={() => void run("request_upload")}
          >
            {pending === "request_upload" ? "…" : "Request document"}
          </button>
        ) : null}
        {wf.markReviewed ? (
          <button
            type="button"
            disabled={pending !== null}
            className={`${btn} border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800`}
            onClick={() => void run("mark_reviewed")}
          >
            {pending === "mark_reviewed" ? "…" : "Mark as reviewed"}
          </button>
        ) : null}
        {wf.sendToAdmin ? (
          <button
            type="button"
            disabled={pending !== null}
            className={`${btn} border-amber-900/60 bg-black text-amber-100 hover:bg-zinc-950`}
            onClick={() => void run("admin_review")}
          >
            {pending === "admin_review" ? "…" : "Send to admin review"}
          </button>
        ) : null}
      </div>
      {status ? <p className="mt-2 text-[11px] text-zinc-400">{status}</p> : null}
    </div>
  );
}
