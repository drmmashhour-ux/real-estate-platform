import type {
  AutomationFlowId,
  AutomationRun,
  AutomationTrackingStats,
  DelayPreset,
  OutboundMessage,
  PersonalizationContext,
  ScheduledAutomationStep,
} from "./automation.types";
import { renderEmail } from "./email.service";
import { renderSms } from "./sms.service";

const STORAGE_KEY = "lecipm-growth-automation-v1";

export type GrowthAutomationStore = {
  runs: Record<string, AutomationRun>;
  messages: Record<string, OutboundMessage>;
};

function emptyStore(): GrowthAutomationStore {
  return { runs: {}, messages: {} };
}

let memory: GrowthAutomationStore = emptyStore();

export function loadGrowthAutomationStore(): GrowthAutomationStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = { ...emptyStore(), ...JSON.parse(raw) } as GrowthAutomationStore;
    } catch {
      /* ignore */
    }
  }
  return memory;
}

export function saveGrowthAutomationStore(store: GrowthAutomationStore): void {
  memory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function resetGrowthAutomationStoreForTests(): void {
  memory = emptyStore();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ga-${Date.now()}`;
}

const FLOW_BLUEPRINTS: Record<
  AutomationFlowId,
  Omit<ScheduledAutomationStep, "executeAtIso" | "runKey">[]
> = {
  NEW_LEAD: [
    { id: "nl-1", channel: "EMAIL", delay: "immediate", templateKey: "new_lead_welcome" },
    { id: "nl-2", channel: "SMS", delay: "immediate", templateKey: "new_lead_sms_ping" },
    { id: "nl-3", channel: "EMAIL", delay: "plus_1d", templateKey: "new_lead_followup" },
    { id: "nl-4", channel: "CONTENT", delay: "plus_3d", templateKey: "new_lead_listings_suggestions" },
  ],
  BROKER_LEAD: [
    { id: "br-1", channel: "EMAIL", delay: "immediate", templateKey: "broker_intro" },
    { id: "br-2", channel: "SMS", delay: "plus_1d", templateKey: "broker_sms_hook" },
    { id: "br-3", channel: "EMAIL", delay: "plus_3d", templateKey: "broker_demo_followup" },
  ],
  INVESTOR_LEAD: [
    { id: "inv-1", channel: "EMAIL", delay: "immediate", templateKey: "investor_pitch" },
    { id: "inv-2", channel: "SMS", delay: "plus_1d", templateKey: "investor_sms_hook" },
    { id: "inv-3", channel: "EMAIL", delay: "plus_3d", templateKey: "investor_meeting_invite" },
  ],
};

export function delayMs(delay: DelayPreset): number {
  if (delay === "immediate") return 0;
  if (delay === "plus_1d") return 86_400_000;
  if (delay === "plus_3d") return 3 * 86_400_000;
  return 0;
}

function buildSteps(
  flowId: AutomationFlowId,
  anchor: Date,
  runId: string,
  leadKey: string
): ScheduledAutomationStep[] {
  const defs = FLOW_BLUEPRINTS[flowId];
  return defs.map((d, i) => {
    const at = new Date(anchor.getTime() + delayMs(d.delay));
    return {
      ...d,
      executeAtIso: at.toISOString(),
      runKey: `${runId}:${leadKey}:${d.id}:${i}`,
    };
  });
}

/**
 * Creates a scheduled automation run (multi-channel steps with immediate / +1d / +3d offsets).
 */
export function triggerAutomationFlow(
  flowId: AutomationFlowId,
  leadKey: string,
  personalization: PersonalizationContext,
  anchorDate = new Date()
): AutomationRun {
  const runId = uid();
  const steps = buildSteps(flowId, anchorDate, runId, leadKey);
  const run: AutomationRun = {
    id: runId,
    flowId,
    leadKey,
    personalization,
    createdAtIso: anchorDate.toISOString(),
    steps,
  };
  const store = loadGrowthAutomationStore();
  store.runs[runId] = run;
  saveGrowthAutomationStore(store);
  return run;
}

export function listRuns(): AutomationRun[] {
  return Object.values(loadGrowthAutomationStore().runs).sort((a, b) =>
    (b.createdAtIso || "").localeCompare(a.createdAtIso || "")
  );
}

/** CONTENT channel uses the same template registry as email for listing-style digests */
function renderContentBody(templateKey: string, ctx: PersonalizationContext): string {
  const email = renderEmail(templateKey, ctx);
  return email.body;
}

/**
 * Simulates sending a single step — persists OutboundMessage for tracking.
 * In production, replace with SendGrid/Twilio dispatch + same persistence.
 */
export function executeAutomationStep(
  step: ScheduledAutomationStep,
  run: AutomationRun
): OutboundMessage {
  const ctx = run.personalization;
  let subject: string | undefined;
  let body: string;

  if (step.channel === "EMAIL") {
    const e = renderEmail(step.templateKey, ctx);
    subject = e.subject;
    body = e.body;
  } else if (step.channel === "SMS") {
    body = renderSms(step.templateKey, ctx);
  } else {
    body = renderContentBody(step.templateKey, ctx);
    subject = `Content — ${step.templateKey}`;
  }

  const msg: OutboundMessage = {
    id: uid(),
    runId: run.id,
    channel: step.channel,
    templateKey: step.templateKey,
    subject,
    body,
    sentAtIso: new Date().toISOString(),
    leadKey: run.leadKey,
    metrics: { opens: 0, clicks: 0, replied: false, converted: false },
  };

  const store = loadGrowthAutomationStore();
  store.messages[msg.id] = msg;
  saveGrowthAutomationStore(store);
  return msg;
}

/** Process all steps that are due at or before `now` for a run */
export function processDueStepsForRun(runId: string, now = new Date()): OutboundMessage[] {
  const store = loadGrowthAutomationStore();
  const run = store.runs[runId];
  if (!run) return [];

  const sent: OutboundMessage[] = [];
  const t = now.getTime();

  for (const step of run.steps) {
    if (new Date(step.executeAtIso).getTime() > t) continue;
    const already = Object.values(store.messages).some(
      (m) => m.runId === runId && m.templateKey === step.templateKey && m.channel === step.channel
    );
    if (already) continue;
    sent.push(executeAutomationStep(step, run));
  }

  return sent;
}

export function processAllDueSteps(now = new Date()): OutboundMessage[] {
  const out: OutboundMessage[] = [];
  for (const run of listRuns()) {
    out.push(...processDueStepsForRun(run.id, now));
  }
  return out;
}

export function listMessages(): OutboundMessage[] {
  return Object.values(loadGrowthAutomationStore().messages).sort((a, b) =>
    (b.sentAtIso || "").localeCompare(a.sentAtIso || "")
  );
}

export function getMessage(id: string): OutboundMessage | undefined {
  return loadGrowthAutomationStore().messages[id];
}

export function recordMessageOpen(messageId: string): OutboundMessage | null {
  return bumpMetric(messageId, "opens", 1);
}

export function recordMessageClick(messageId: string): OutboundMessage | null {
  return bumpMetric(messageId, "clicks", 1);
}

export function recordMessageReply(messageId: string): OutboundMessage | null {
  const store = loadGrowthAutomationStore();
  const m = store.messages[messageId];
  if (!m) return null;
  m.metrics.replied = true;
  saveGrowthAutomationStore(store);
  return m;
}

export function recordMessageConversion(messageId: string): OutboundMessage | null {
  const store = loadGrowthAutomationStore();
  const m = store.messages[messageId];
  if (!m) return null;
  m.metrics.converted = true;
  saveGrowthAutomationStore(store);
  return m;
}

function bumpMetric(
  messageId: string,
  field: "opens" | "clicks",
  delta: number
): OutboundMessage | null {
  const store = loadGrowthAutomationStore();
  const m = store.messages[messageId];
  if (!m) return null;
  m.metrics[field] += delta;
  saveGrowthAutomationStore(store);
  return m;
}

export function buildAutomationTrackingStats(messages: OutboundMessage[]): AutomationTrackingStats {
  const n = messages.length;
  if (n === 0) {
    return {
      messageCount: 0,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
      conversionRate: 0,
    };
  }

  const opened = messages.filter((m) => m.metrics.opens > 0).length;
  const clicked = messages.filter((m) => m.metrics.clicks > 0).length;
  const replied = messages.filter((m) => m.metrics.replied).length;
  const converted = messages.filter((m) => m.metrics.converted).length;

  return {
    messageCount: n,
    openRate: opened / n,
    clickRate: clicked / n,
    replyRate: replied / n,
    conversionRate: converted / n,
  };
}
