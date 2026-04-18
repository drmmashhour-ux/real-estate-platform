"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { AiMessagingAssistResult } from "@/modules/growth/ai-autopilot-messaging.types";

type Props = {
  draft: AiMessagingAssistResult;
  emphasize: boolean;
  /** Short label when `emphasize` — e.g. "Draft ready" / "Needs follow-up" (draft only, not sent). */
  emphasisLabel: string | null;
  priority: string | null;
};

export function LeadMessagingAssistCell({ draft, emphasize, emphasisLabel, priority }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const sendTelemetry = useCallback(
    async (event: "copy" | "view") => {
      try {
        await fetch("/api/admin/autopilot/messaging-assist/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            leadId: draft.leadId,
            tone: draft.tone,
            priority,
            event,
          }),
        });
      } catch {
        /* non-blocking */
      }
    },
    [draft.leadId, draft.tone, priority],
  );

  const onToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void sendTelemetry("view");
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.suggestedReply);
      await sendTelemetry("copy");
    } catch {
      /* clipboard may fail in non-secure contexts */
    }
  };

  const preview =
    draft.suggestedReply.length > 100 ? `${draft.suggestedReply.slice(0, 100)}…` : draft.suggestedReply;

  return (
    <div
      className={
        emphasize
          ? "rounded-md border border-amber-500/35 bg-amber-950/25 p-2"
          : "rounded-md border border-slate-700/80 bg-slate-900/40 p-2"
      }
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded border border-slate-600 bg-slate-800/90 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
          {draft.tone}
        </span>
        {emphasize && emphasisLabel ? (
          <span className="text-[10px] font-medium text-amber-200/90">{emphasisLabel}</span>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className="text-[10px] text-emerald-400 hover:text-emerald-300"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
        <button type="button" onClick={() => void onCopy()} className="text-[10px] text-slate-300 hover:text-white">
          Copy
        </button>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="text-[10px] text-slate-400 hover:text-slate-200"
          title="Refresh page data (deterministic draft)"
        >
          Regenerate
        </button>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-slate-300">{expanded ? draft.suggestedReply : preview}</p>
      <p className="mt-1 text-[10px] text-slate-500">{draft.rationale}</p>
    </div>
  );
}
