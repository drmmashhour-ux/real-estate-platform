"use client";

import { plainLanguageDraftGuidance } from "@/modules/broker/closing/broker-draft-guidance";
import type { BrokerFollowUpDraftHintKind } from "@/modules/broker/closing/broker-next-action.service";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";
import type { LeadFollowUpSuggestion } from "@/modules/broker/closing/broker-closing.types";

export type FollowUpPanelItem = LeadFollowUpSuggestion & {
  leadId: string;
  leadName: string;
  stage?: LeadClosingStage;
  /** Prefer next-action hint for messaging assist alignment */
  recommendedHint?: string | null;
};

function urgencyClass(u: string): string {
  if (u === "high") return "bg-rose-500/20 text-rose-200 border-rose-500/40";
  if (u === "medium") return "bg-amber-500/20 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-white/10";
}

function hintFromSuggestion(s: FollowUpPanelItem): BrokerFollowUpDraftHintKind | null {
  if (s.recommendedHint && s.recommendedHint.length > 0) return s.recommendedHint as BrokerFollowUpDraftHintKind;
  switch (s.type) {
    case "first_contact":
      return "first_contact";
    case "follow_up":
      return "follow_up";
    case "meeting_push":
      return "meeting_push";
    case "revive_lead":
      return "revive_lead";
    default:
      return null;
  }
}

export function BrokerFollowUpPanel({
  items,
  accent = "#10b981",
  messagingAssistEnabled,
  buildLeadHref,
}: {
  items: FollowUpPanelItem[];
  accent?: string;
  messagingAssistEnabled: boolean;
  buildLeadHref: (leadId: string, closingDraftHint: string | null) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        No follow-up suggestions right now — your pipeline looks quiet or leads are in a terminal stage.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Suggested follow-ups</h3>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Advisory · no auto-send</span>
      </div>
      <ul className="space-y-3">
        {items.slice(0, 8).map((s) => {
          const hint = hintFromSuggestion(s);
          const hrefGo = buildLeadHref(s.leadId, null);
          const hrefDraft = hint ? buildLeadHref(s.leadId, hint) : hrefGo;

          return (
            <li
              key={`${s.leadId}-${s.id}`}
              className="rounded-lg border border-white/10 bg-black/20 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyClass(s.urgency)}`}
                >
                  {s.urgency}
                </span>
                <span className="text-xs font-medium text-white">{s.leadName}</span>
                {s.stage ? (
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">{s.stage}</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-medium text-white">{s.title}</p>
              <p className="mt-1 text-xs text-slate-400">{s.description}</p>
              {hint ? (
                <>
                  <p className="mt-2 text-[10px] text-slate-500">
                    Recommended cue: <span className="font-mono text-slate-400">{hint}</span>
                    {messagingAssistEnabled
                      ? " — opens draft context on the lead (you send manually)."
                      : " — messaging assist off; use plain guidance below."}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{plainLanguageDraftGuidance(hint)}</p>
                </>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={hrefDraft}
                  onClick={() => {
                    void fetch("/api/broker/closing/metrics", {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ event: "followup_draft_opened" }),
                    }).catch(() => {});
                  }}
                  className="inline-flex rounded-lg border border-emerald-500/40 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/10"
                  style={{ borderColor: `${accent}55` }}
                >
                  {messagingAssistEnabled && hint ? "Open draft" : "Go to lead"}
                </a>
                <a
                  href={hrefGo}
                  className="inline-flex rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/5"
                >
                  Go to lead
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
