/**
 * Deterministic internal follow-up decisions — no outbound comms, no LLM.
 */

import type {
  AiFollowUpDecision,
  AiFollowUpPriority,
  AiFollowUpQueueItem,
  AiFollowUpStatus,
} from "./ai-autopilot-followup.types";
import { parseAiFollowUpFromExplanation } from "./ai-autopilot-followup-persist";

const HANDLED_RECENT_MS = 72 * 60 * 60 * 1000;
const RECENT_LEAD_MS = 7 * 24 * 60 * 60 * 1000;
const STALE_FOR_FOLLOWUP_MS = 24 * 60 * 60 * 1000;

export type LeadFollowUpInput = {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: Date;
  aiScore: number | null;
  aiPriority: string | null;
  aiTags: unknown;
  lastContactedAt: Date | null;
  launchSalesContacted: boolean;
  launchLastContactDate: Date | null;
  pipelineStatus: string;
  aiExplanation?: unknown;
};

function tagList(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === "string");
  return [];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

/** Bounded 0–100 queue score from autopilot + recency + tags (deterministic). */
export function computeFollowUpQueueScore(lead: LeadFollowUpInput, now: number): number {
  const tags = tagList(lead.aiTags);
  let s = lead.aiScore != null && Number.isFinite(lead.aiScore) ? lead.aiScore : 50;
  const ageMs = now - lead.createdAt.getTime();
  if (ageMs < 48 * 60 * 60 * 1000) s += 10;
  if (tags.includes("needs_followup")) s += 12;
  if (tags.includes("high_intent")) s += 8;
  if (tags.includes("low_info")) s += 5;
  if (!(lead.phone?.trim().length)) s -= 5;
  if ((lead.message?.trim().length ?? 0) > 40) s += 4;
  return clamp(s, 0, 100);
}

function handledRecently(lead: LeadFollowUpInput, now: number): boolean {
  if (lead.lastContactedAt && now - new Date(lead.lastContactedAt).getTime() < HANDLED_RECENT_MS) return true;
  if (
    lead.launchSalesContacted &&
    lead.launchLastContactDate &&
    now - new Date(lead.launchLastContactDate).getTime() < HANDLED_RECENT_MS
  ) {
    return true;
  }
  const ps = lead.pipelineStatus?.toLowerCase() ?? "";
  if (["contacted", "qualified", "meeting", "negotiation", "won"].includes(ps)) return true;
  return false;
}

function isoHoursFromNow(hours: number, now: number): string {
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

function decisionBase(
  lead: LeadFollowUpInput,
  status: AiFollowUpStatus,
  followUpPriority: AiFollowUpPriority,
  queueScore: number,
  rationale: string,
  now: number,
  remindersEnabled: boolean,
  nextActionAt?: string,
  reminderReason?: string,
): AiFollowUpDecision {
  const updatedAt = new Date(now).toISOString();
  return {
    leadId: lead.leadId,
    status,
    followUpPriority,
    queueScore,
    rationale,
    updatedAt,
    nextActionAt: remindersEnabled ? nextActionAt : undefined,
    reminderReason: remindersEnabled ? reminderReason : undefined,
  };
}

/**
 * Build a single internal follow-up decision. Preserves `done` and active snooze (`waiting` with future `nextActionAt`).
 */
export function buildLeadFollowUpDecision(
  lead: LeadFollowUpInput,
  opts?: { remindersEnabled?: boolean; now?: number },
): AiFollowUpDecision {
  const now = opts?.now ?? Date.now();
  const remindersEnabled = opts?.remindersEnabled !== false;
  const tags = tagList(lead.aiTags);
  const prior = parseAiFollowUpFromExplanation(lead.aiExplanation);
  const q = computeFollowUpQueueScore(lead, now);
  const ageMs = now - lead.createdAt.getTime();
  const handled = handledRecently(lead, now);

  if (prior?.status === "done") {
    return decisionBase(lead, "done", "low", q, "Marked done in internal queue (preserved).", now, remindersEnabled);
  }

  if (prior?.status === "waiting" && prior.nextActionAt) {
    const snoozeUntil = Date.parse(prior.nextActionAt);
    if (!Number.isNaN(snoozeUntil) && snoozeUntil > now) {
      return {
        leadId: lead.leadId,
        status: "waiting",
        followUpPriority: prior.followUpPriority ?? "medium",
        queueScore: q,
        rationale: "Snoozed — internal follow-up deferred until nextActionAt.",
        updatedAt: new Date(now).toISOString(),
        nextActionAt: remindersEnabled ? prior.nextActionAt : undefined,
        reminderReason: remindersEnabled ? "Internal snooze active" : undefined,
      };
    }
  }

  if (handled) {
    return decisionBase(
      lead,
      "waiting",
      "low",
      q,
      "Recently touched internally — waiting for next cycle.",
      now,
      remindersEnabled,
      remindersEnabled ? isoHoursFromNow(48, now) : undefined,
      remindersEnabled ? "Recent internal handling" : undefined,
    );
  }

  if (lead.aiPriority === "high" && ageMs < RECENT_LEAD_MS && !handled) {
    return decisionBase(
      lead,
      "due_now",
      "high",
      Math.max(q, 85),
      "High AI priority and recent lead without recent internal handling.",
      now,
      remindersEnabled,
      remindersEnabled ? new Date(now).toISOString() : undefined,
      remindersEnabled ? "High-priority internal review" : undefined,
    );
  }

  if (tags.includes("needs_followup") && ageMs >= STALE_FOR_FOLLOWUP_MS && !handled) {
    return decisionBase(
      lead,
      "due_now",
      "high",
      Math.max(q, 80),
      "needs_followup tag and aging inquiry — internal attention suggested.",
      now,
      remindersEnabled,
      remindersEnabled ? new Date(now).toISOString() : undefined,
      remindersEnabled ? "Tagged for follow-up" : undefined,
    );
  }

  if (tags.includes("low_info") && !handled) {
    return decisionBase(
      lead,
      "queued",
      "medium",
      q,
      "Low-info lead — queue for clarification (internal review only).",
      now,
      remindersEnabled,
      remindersEnabled ? isoHoursFromNow(24, now) : undefined,
      remindersEnabled ? "Awaiting richer context" : undefined,
    );
  }

  if (ageMs < STALE_FOR_FOLLOWUP_MS && !handled) {
    return decisionBase(
      lead,
      "new",
      "medium",
      q,
      "New inquiry — monitor; no urgent internal follow-up signal yet.",
      now,
      remindersEnabled,
      remindersEnabled ? isoHoursFromNow(48, now) : undefined,
      remindersEnabled ? "New lead buffer" : undefined,
    );
  }

  return decisionBase(
    lead,
    "queued",
    "medium",
    q,
    "Standard internal queue — review when capacity allows.",
    now,
    remindersEnabled,
    remindersEnabled ? isoHoursFromNow(24, now) : undefined,
    remindersEnabled ? "Routine queue" : undefined,
  );
}

/** Map CRM lead row (subset) to follow-up analyzer input — read-only. */
export function leadRowToFollowUpInput(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: Date;
  aiScore: number | null;
  aiPriority: string | null;
  aiTags: unknown;
  lastContactedAt: Date | null;
  launchSalesContacted: boolean;
  launchLastContactDate: Date | null;
  pipelineStatus: string;
  aiExplanation: unknown;
}): LeadFollowUpInput {
  return {
    leadId: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.createdAt,
    aiScore: row.aiScore,
    aiPriority: row.aiPriority,
    aiTags: row.aiTags,
    lastContactedAt: row.lastContactedAt,
    launchSalesContacted: row.launchSalesContacted,
    launchLastContactDate: row.launchLastContactDate,
    pipelineStatus: row.pipelineStatus,
    aiExplanation: row.aiExplanation,
  };
}

/** Sort by queueScore descending; includes contact + aiPriority for admin tables. */
export function buildFollowUpQueue(
  leads: LeadFollowUpInput[],
  opts?: { remindersEnabled?: boolean; now?: number },
): AiFollowUpQueueItem[] {
  const now = opts?.now ?? Date.now();
  const remindersEnabled = opts?.remindersEnabled !== false;
  const items: AiFollowUpQueueItem[] = leads.map((lead) => {
    const d = buildLeadFollowUpDecision(lead, { remindersEnabled, now });
    return {
      ...d,
      name: lead.name,
      email: lead.email,
      aiPriority: lead.aiPriority,
    };
  });
  return [...items].sort((a, b) => b.queueScore - a.queueScore);
}
