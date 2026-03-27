/**
 * Pure helpers for CRM automation UI (DM suggestions + recommended next action).
 */

export type DmAutomationSuggestion = {
  id: string;
  title: string;
  detail: string;
};

export type RecommendedAutomationAction = {
  label: string;
  reason: string;
  kind: "call" | "whatsapp" | "meeting" | "email" | "dm";
};

export function getDmAutomationSuggestions(lead: {
  dmStatus?: string | null;
  lastDmAt?: Date | string | null;
  pipelineStatus?: string | null;
}): DmAutomationSuggestion[] {
  const out: DmAutomationSuggestion[] = [];
  const dm = lead.dmStatus ?? "none";
  const pipe = lead.pipelineStatus ?? "new";
  if (pipe === "won" || pipe === "lost") return out;
  if (dm === "replied") return out;

  if (dm === "none") {
    out.push({
      id: "dm_initial",
      title: "Suggested: send initial DM",
      detail: "New or untouched — open with a short, personal intro.",
    });
  }

  const lastDm = lead.lastDmAt ? new Date(takeString(lead.lastDmAt)) : null;
  if (dm === "sent" && lastDm && !Number.isNaN(lastDm.getTime())) {
    const ms = Date.now() - lastDm.getTime();
    const d1 = 24 * 60 * 60 * 1000;
    const d3 = 3 * d1;
    if (ms >= d1 && ms < d3) {
      out.push({
        id: "dm_followup_24h",
        title: "Suggested: follow-up DM",
        detail: "No reply in 24h — send a short follow-up.",
      });
    } else if (ms >= d3) {
      out.push({
        id: "dm_closing_3d",
        title: "Suggested: closing DM",
        detail: "No reply in 3+ days — last structured touch + CTA.",
      });
    }
  }

  return out;
}

function takeString(d: Date | string): string {
  return typeof d === "string" ? d : d.toISOString();
}

export function getRecommendedAutomationAction(lead: {
  pipelineStatus?: string | null;
  highIntent?: boolean | null;
  score?: number | null;
  meetingAt?: Date | string | null;
  leadSource?: string | null;
  lastContactedAt?: Date | string | null;
}): RecommendedAutomationAction {
  const pipe = lead.pipelineStatus ?? "new";
  const score = lead.score ?? 0;

  if (pipe === "new" && lead.highIntent) {
    return {
      label: "Call now",
      reason: "High-intent signals — strike while interest is hot.",
      kind: "call",
    };
  }
  if (pipe === "new") {
    return {
      label: "Send WhatsApp",
      reason: "Fast reply channel for fresh leads.",
      kind: "whatsapp",
    };
  }
  if ((pipe === "contacted" || pipe === "follow_up") && !lead.meetingAt) {
    return {
      label: "Schedule meeting",
      reason: "Book a concrete next step to qualify.",
      kind: "meeting",
    };
  }
  if (pipe === "qualified" || pipe === "meeting_scheduled") {
    return {
      label: "Schedule meeting",
      reason: "Align on offer / timeline — keep momentum.",
      kind: "meeting",
    };
  }
  if (pipe === "negotiation" || pipe === "closing") {
    return {
      label: "Close the loop",
      reason: "Confirm paperwork timing and remove last friction.",
      kind: "call",
    };
  }
  if (lead.leadSource === "evaluation_lead" && score >= 70) {
    return {
      label: "Send follow-up email",
      reason: "Strong evaluation lead — nurture with the email sequence.",
      kind: "email",
    };
  }
  if (!lead.lastContactedAt) {
    return {
      label: "Call now",
      reason: "No logged contact yet.",
      kind: "call",
    };
  }
  return {
    label: "Call now",
    reason: "Maintain cadence with a direct conversation.",
    kind: "call",
  };
}
