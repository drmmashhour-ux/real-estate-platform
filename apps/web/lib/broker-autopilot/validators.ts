import type { LecipmBrokerAutopilotMode } from "@prisma/client";

const MODES: LecipmBrokerAutopilotMode[] = ["off", "assist", "safe_autopilot", "approval_required"];

export function parseAutopilotSettingsBody(raw: unknown): {
  mode?: LecipmBrokerAutopilotMode;
  autoDraftFollowups?: boolean;
  autoSuggestVisits?: boolean;
  autoPrioritizeHotLeads?: boolean;
  dailyDigestEnabled?: boolean;
  pauseUntil?: Date | null;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: {
    mode?: LecipmBrokerAutopilotMode;
    autoDraftFollowups?: boolean;
    autoSuggestVisits?: boolean;
    autoPrioritizeHotLeads?: boolean;
    dailyDigestEnabled?: boolean;
    pauseUntil?: Date | null;
  } = {};
  if (typeof o.mode === "string" && MODES.includes(o.mode as LecipmBrokerAutopilotMode)) {
    out.mode = o.mode as LecipmBrokerAutopilotMode;
  }
  if (typeof o.autoDraftFollowups === "boolean") out.autoDraftFollowups = o.autoDraftFollowups;
  if (typeof o.autoSuggestVisits === "boolean") out.autoSuggestVisits = o.autoSuggestVisits;
  if (typeof o.autoPrioritizeHotLeads === "boolean") out.autoPrioritizeHotLeads = o.autoPrioritizeHotLeads;
  if (typeof o.dailyDigestEnabled === "boolean") out.dailyDigestEnabled = o.dailyDigestEnabled;
  if (o.pauseUntil === null) out.pauseUntil = null;
  else if (typeof o.pauseUntil === "string") {
    const d = new Date(o.pauseUntil);
    if (!Number.isNaN(d.getTime())) out.pauseUntil = d;
  }
  return out;
}
