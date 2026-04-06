"use client";

import { useState, useTransition } from "react";
import {
  approveGeneratedContent,
  publishGeneratedContent,
  rejectGeneratedContent,
  rollbackGeneratedContent,
  submitGeneratedContentForReview,
} from "./actions";

export function ContentRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/10"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await submitGeneratedContentForReview(id);
              setMsg(r.ok ? "Submitted" : r.error ?? "Error");
            })
          }
        >
          Submit review
        </button>
      ) : null}
      {status === "pending_review" ? (
        <>
          <button
            type="button"
            disabled={pending}
            className="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
            onClick={() =>
              start(async () => {
                setMsg(null);
                const r = await approveGeneratedContent(id);
                setMsg(r.ok ? "Approved" : r.error ?? "Error");
              })
            }
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
            onClick={() =>
              start(async () => {
                setMsg(null);
                const r = await rejectGeneratedContent(id);
                setMsg(r.ok ? "Rejected" : r.error ?? "Error");
              })
            }
          >
            Reject
          </button>
        </>
      ) : null}
      {status === "approved" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded border border-amber-500/40 px-2 py-1 text-xs text-amber-200 hover:bg-amber-500/10"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await publishGeneratedContent(id);
              setMsg(r.ok ? "Published" : r.error ?? "Error");
            })
          }
        >
          Publish
        </button>
      ) : null}
      {status === "published" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/10"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await rollbackGeneratedContent(id);
              setMsg(r.ok ? "Rolled back" : r.error ?? "Error");
            })
          }
        >
          Rollback
        </button>
      ) : null}
      {msg ? <span className="text-xs text-white/50">{msg}</span> : null}
    </div>
  );
}
