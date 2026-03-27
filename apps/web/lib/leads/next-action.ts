import { normalizePipelineStage } from "@/lib/leads/pipeline-stage";

export type NextBestActionKey =
  | "call_now"
  | "send_whatsapp"
  | "schedule_meeting"
  | "send_follow_up_email"
  | "push_to_negotiation"
  | "move_to_closing"
  | "schedule_final_call"
  | "send_closing_followup"
  | "mark_won";

export type NextBestAction = {
  key: NextBestActionKey;
  /** Primary CTA label */
  label: string;
  /** Subline for assistant UI */
  hint: string;
};

const HOURS_STALE_CONTACT = 48;

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60);
}

/**
 * Single next best action from stage + last touch + lightweight activity hints.
 */
export function getNextBestAction(
  lead: {
    pipelineStatus?: string | null;
    lastContactedAt?: string | Date | null;
    lastContactAt?: string | Date | null;
    nextFollowUpAt?: string | Date | null;
    meetingAt?: string | Date | null;
    leadSource?: string | null;
  },
  options?: { hasRecentConsultationClick?: boolean }
): NextBestAction {
  const stage = normalizePipelineStage(lead.pipelineStatus);
  const lastRaw = lead.lastContactedAt ?? lead.lastContactAt;
  const last =
    typeof lastRaw === "string"
      ? lastRaw
      : lastRaw instanceof Date
        ? lastRaw.toISOString()
        : undefined;
  const staleH = hoursSince(last);
  const isEval = lead.leadSource === "evaluation_lead";

  if (stage === "won" || stage === "lost") {
    return {
      key: "call_now",
      label: "Review or nurture",
      hint: "Lead is closed in CRM—follow up only if relationship or referral opportunity.",
    };
  }

  if (stage === "closing") {
    return {
      key: "send_closing_followup",
      label: "Send closing follow-up",
      hint: "Reconfirm net benefit and propose a firm next step—paperwork or final call.",
    };
  }

  if (stage === "negotiation") {
    return {
      key: "move_to_closing",
      label: "Move to closing",
      hint: "When terms are aligned, move stage to Closing and lock the final paperwork timeline.",
    };
  }

  if (stage === "meeting_scheduled") {
    if (!lead.meetingAt) {
      return {
        key: "schedule_meeting",
        label: "Book meeting",
        hint: "Pick a firm date/time and send a calendar confirmation.",
      };
    }
    return {
      key: "call_now",
      label: "Call to confirm meeting",
      hint: "Quick confirmation call reduces no-shows and builds trust.",
    };
  }

  if (stage === "qualified") {
    return {
      key: "schedule_meeting",
      label: "Book meeting",
      hint: "Move from discovery to a concrete in-person or video consultation.",
    };
  }

  if (stage === "new" || (staleH != null && staleH > HOURS_STALE_CONTACT && stage === "contacted")) {
    return {
      key: "call_now",
      label: "Call now",
      hint:
        stage === "new"
          ? "New lead—first voice contact within minutes dramatically improves conversion."
          : "No recent contact—reconnect by phone while interest is warm.",
    };
  }

  if (stage === "contacted") {
    if (options?.hasRecentConsultationClick || isEval) {
      return {
        key: "send_follow_up_email",
        label: "Send follow-up email",
        hint: "Reinforce the evaluation and offer a precise broker opinion.",
      };
    }
    return {
      key: "send_whatsapp",
      label: "Send WhatsApp",
      hint: "Short async message often gets a faster reply than voicemail.",
    };
  }

  return {
    key: "call_now",
    label: "Call now",
    hint: "Stay in rhythm—confirm timing, objections, and next step.",
  };
}
