"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AiResponseDeskItem, AiResponseDeskStatus } from "@/modules/growth/ai-response-desk.types";

type DeskFilter = "all" | "high" | "followup" | "draft_ready" | "needs_review";

function statusLabel(s: AiResponseDeskStatus): string {
  switch (s) {
    case "draft_ready":
      return "Draft ready";
    case "needs_review":
      return "Needs review";
    case "reviewed":
      return "Reviewed";
    case "followup_recommended":
      return "Follow-up";
    case "done":
      return "Done";
    default:
      return s;
  }
}

function summarize(items: AiResponseDeskItem[]) {
  const counts: Record<AiResponseDeskStatus, number> = {
    draft_ready: 0,
    needs_review: 0,
    reviewed: 0,
    followup_recommended: 0,
    done: 0,
  };
  for (const it of items) {
    counts[it.draftStatus] = (counts[it.draftStatus] ?? 0) + 1;
  }
  return counts;
}

function matchesFilter(item: AiResponseDeskItem, f: DeskFilter): boolean {
  if (f === "all") return true;
  if (f === "high") return item.aiPriority === "high";
  if (f === "followup") return item.draftStatus === "followup_recommended" || item.followUpPriority === "high";
  if (f === "draft_ready") return item.draftStatus === "draft_ready";
  if (f === "needs_review") return item.draftStatus === "needs_review";
  return true;
}

export function LeadResponseDeskPanel({
  initialItems,
  reviewActionsEnabled,
}: {
  initialItems: AiResponseDeskItem[];
  reviewActionsEnabled: boolean;
}) {
  const router = useRouter();
  const items = initialItems;
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetch("/api/admin/autopilot/response-desk/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event: "panel_view", queuedCount: initialItems.length }),
    }).catch(() => {});
  }, [initialItems.length]);

  const counts = useMemo(() => summarize(items), [items]);

  const filtered = useMemo(() => items.filter((it) => matchesFilter(it, filter)), [items, filter]);

  const postState = useCallback(
    async (leadId: string, action: "reviewed" | "needs_review" | "done") => {
      const r = await fetch("/api/admin/autopilot/response-desk/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ leadId, action }),
      });
      if (r.ok) {
        router.refresh();
      }
    },
    [router],
  );

  const copyReply = useCallback(async (leadId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await fetch("/api/admin/autopilot/response-desk/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ event: "copy", leadId }),
      });
    } catch {
      /* clipboard / telemetry best-effort */
    }
  }, []);

  return (
    <section className="rounded-xl border border-sky-500/25 bg-slate-950/60 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-sky-100">
          <span aria-hidden>✉️</span> Response Desk
        </h2>
        <p className="text-xs text-slate-500">Internal drafts only — nothing is sent from this UI.</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-slate-300">
          Draft ready: <strong className="text-slate-100">{counts.draft_ready}</strong>
        </span>
        <span className="rounded border border-amber-500/30 bg-amber-950/25 px-2 py-1 text-amber-100/90">
          Needs review: <strong>{counts.needs_review}</strong>
        </span>
        <span className="rounded border border-emerald-500/30 bg-emerald-950/20 px-2 py-1 text-emerald-100/90">
          Reviewed: <strong>{counts.reviewed}</strong>
        </span>
        <span className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-slate-300">
          Done: <strong>{counts.done}</strong>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["high", "High priority"],
            ["followup", "Needs follow-up"],
            ["draft_ready", "Draft ready"],
            ["needs_review", "Needs review"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "rounded-lg border border-sky-500/50 bg-sky-950/40 px-2.5 py-1 text-xs font-medium text-sky-100"
                : "rounded-lg border border-slate-700 bg-slate-900/50 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No leads in this filter.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((it) => {
            const prev =
              it.suggestedReply && it.suggestedReply.length > 140 ? `${it.suggestedReply.slice(0, 140)}…` : it.suggestedReply;
            const open = !!expanded[it.leadId];
            return (
              <li
                key={it.leadId}
                className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{it.leadName}</p>
                    <p className="text-xs text-slate-500">{it.leadEmail}</p>
                  </div>
                  <span className="rounded border border-slate-600 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                    {statusLabel(it.draftStatus)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span>
                    AI priority: <strong className="text-slate-200">{it.aiPriority ?? "—"}</strong>
                  </span>
                  <span>
                    Follow-up: <strong className="text-slate-200">{it.followUpPriority ?? "—"}</strong>
                  </span>
                </div>
                {it.suggestedReply ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{open ? it.suggestedReply : prev}</p>
                ) : (
                  <p className="mt-2 text-xs italic text-slate-500">No draft text — follow-up or review metadata only.</p>
                )}
                {it.rationale ? <p className="mt-1 text-xs text-slate-500">{it.rationale}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {it.suggestedReply ? (
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      onClick={() => void copyReply(it.leadId, it.suggestedReply!)}
                    >
                      Copy
                    </button>
                  ) : null}
                  {it.suggestedReply ? (
                    <button
                      type="button"
                      className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      onClick={() => setExpanded((e) => ({ ...e, [it.leadId]: !open }))}
                    >
                      {open ? "Collapse" : "Expand"}
                    </button>
                  ) : null}
                  {reviewActionsEnabled ? (
                    <>
                      <button
                        type="button"
                        className="rounded border border-emerald-600/50 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-950/40"
                        onClick={() => void postState(it.leadId, "reviewed")}
                      >
                        Mark reviewed
                      </button>
                      <button
                        type="button"
                        className="rounded border border-amber-600/50 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-950/30"
                        onClick={() => void postState(it.leadId, "needs_review")}
                      >
                        Needs review
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                        onClick={() => void postState(it.leadId, "done")}
                      >
                        Mark done
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-600">Review actions disabled (flag off).</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
