"use client";

import type { AssistantActionType, AssistantSuggestion } from "@/modules/assistant/assistant.types";

function actionTitle(t: AssistantActionType): string {
  switch (t) {
    case "SEND_FOLLOWUP":
      return "Send follow-up email";
    case "SCHEDULE_VISIT":
      return "Open scheduling";
    case "RESCHEDULE_VISIT":
      return "Reschedule visit";
    case "ESCALATE_TO_ADMIN":
      return "Escalate to ops";
    case "ASSIGN_BROKER":
      return "Assign broker";
    case "SEND_SIMILAR_LISTINGS":
      return "Similar listings link";
    case "REQUEST_OFFER_UPDATE":
      return "Log offer update request";
    default:
      return "Run action";
  }
}

export function AssistantActionConfirmModal(props: {
  open: boolean;
  suggestion: AssistantSuggestion | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.open || !props.suggestion?.actionType) return null;
  const a = props.suggestion.actionType;
  const preview =
    a === "SEND_FOLLOWUP"
      ? "Sends one LECIPM-branded follow-up email to the lead’s address on file (assistant disclosure included)."
      : a === "SCHEDULE_VISIT"
        ? "Opens your lead workspace to schedule a visit — no auto-booking."
        : a === "ESCALATE_TO_ADMIN"
          ? "Notifies ops (if configured) and logs this on the lead timeline."
          : a === "REQUEST_OFFER_UPDATE"
            ? "Adds a CRM timeline note so your team follows up on the offer."
            : "Runs the selected assistant action and logs the outcome.";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
        <h2 className="text-base font-semibold text-foreground">{actionTitle(a)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{props.suggestion.message}</p>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{preview}</p>
        {props.suggestion.actionPayload?.leadId ? (
          <p className="mt-2 text-xs font-mono text-muted-foreground">
            Lead: {String(props.suggestion.actionPayload.leadId)}
          </p>
        ) : null}
        {props.suggestion.actionPayload?.dealId ? (
          <p className="mt-1 text-xs font-mono text-muted-foreground">
            Deal: {String(props.suggestion.actionPayload.dealId)}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/40"
            onClick={props.onCancel}
            disabled={props.loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-premium-gold px-3 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            onClick={props.onConfirm}
            disabled={props.loading}
          >
            {props.loading ? "Working…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
