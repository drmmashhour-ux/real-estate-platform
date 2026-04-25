import type {
  CallEvent,
  CallSession,
  CallSessionMetadata,
  CallSessionStatus,
  PostCallAnalysisResult,
} from "@/modules/messaging/call/call.types";
import { callAiLog } from "@/modules/messaging/call/call-ai-logger";

type Internal = CallSession & {
  events: CallEvent[];
  /** Raw transcript; only present when consented. Not logged in full. */
  transcriptText?: string;
  postCallResult?: PostCallAnalysisResult;
  /** In-memory only; for tests / optional replay. */
  _eventLog: string[];
};

function getStore(): Map<string, Internal> {
  const g = globalThis as unknown as { __lecipmCallSessionStore?: Map<string, Internal> };
  g.__lecipmCallSessionStore ??= new Map();
  return g.__lecipmCallSessionStore;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * In-process call sessions (single instance / dev; replace with Prisma/Redis for multi-node later).
 * Never throws.
 */
export function startCallSession(args: {
  id?: string;
  conversationId: string;
  brokerId: string;
  clientId: string;
  metadata?: CallSessionMetadata;
}): { ok: true; session: CallSession } | { ok: false; error: string } {
  try {
    const id = args.id?.trim() || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `call_${Date.now()}`);
    const store = getStore();
    if (store.has(id)) return { ok: false, error: "Call id already in use" };
    const startedAt = nowIso();
    const session: Internal = {
      id,
      conversationId: args.conversationId,
      brokerId: args.brokerId,
      clientId: args.clientId,
      startedAt,
      endedAt: null,
      durationSec: null,
      status: "active",
      metadata: { ...(args.metadata ?? {}) },
      events: [],
      _eventLog: [],
    };
    store.set(id, session);
    callAiLog.callStarted({ callId: id, conversationId: args.conversationId, brokerId: args.brokerId });
    return { ok: true, session: publicSession(session) };
  } catch (e) {
    callAiLog.warn("startCallSession", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "Could not start call" };
  }
}

export function getCallSession(callId: string): { ok: true; session: CallSession; internal: Internal } | { ok: false } {
  try {
    const s = getStore().get(callId);
    if (!s) return { ok: false };
    return { ok: true, session: publicSession(s), internal: s };
  } catch {
    return { ok: false };
  }
}

export function trackCallEvent(
  callId: string,
  event: CallEvent
): { ok: true } | { ok: false; error: string } {
  try {
    const store = getStore();
    const s = store.get(callId);
    if (!s) return { ok: false, error: "Not found" };
    if (s.status !== "active") return { ok: false, error: "Call is not active" };
    s.events.push(event);
    const line = `evt:${event.type}@${event.timestamp}${event.speaker ? `:${event.speaker}` : ""}`;
    s._eventLog.push(line);
    if (s._eventLog.length > 500) s._eventLog.splice(0, s._eventLog.length - 500);
    callAiLog.realtimeSignalDetected({ callId, type: event.type });
    return { ok: true };
  } catch (e) {
    callAiLog.warn("trackCallEvent", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "Could not record event" };
  }
}

export function endCallSession(
  callId: string
): { ok: true; session: CallSession } | { ok: false; error: string } {
  try {
    const store = getStore();
    const s = store.get(callId);
    if (!s) return { ok: false, error: "Not found" };
    if (s.status === "ended") return { ok: true, session: publicSession(s) };
    const endedAt = nowIso();
    const dSec = (Date.parse(endedAt) - Date.parse(s.startedAt)) / 1000;
    s.endedAt = endedAt;
    s.durationSec = dSec > 0 ? Math.floor(dSec) : 0;
    s.status = "ended" as CallSessionStatus;
    callAiLog.callEnded({ callId, durationSec: s.durationSec });
    return { ok: true, session: publicSession(s) };
  } catch (e) {
    callAiLog.warn("endCallSession", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "Could not end call" };
  }
}

/** Local-only debug line, redacted, no raw transcript. */
export function getCallEventLogLines(callId: string, max = 20): string[] {
  const s = getStore().get(callId);
  if (!s) return [];
  return s._eventLog.slice(-max);
}

function publicSession(s: Internal): CallSession {
  return {
    id: s.id,
    conversationId: s.conversationId,
    brokerId: s.brokerId,
    clientId: s.clientId,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSec: s.durationSec,
    status: s.status,
    metadata: { ...s.metadata },
  };
}

/** For post-call / analysis: internal session reference. */
export function getSessionInternalForAnalysis(callId: string): Internal | null {
  try {
    return getStore().get(callId) ?? null;
  } catch {
    return null;
  }
}

export function setCallPostAnalysis(callId: string, result: PostCallAnalysisResult): void {
  try {
    const s = getStore().get(callId);
    if (!s) return;
    s.postCallResult = result;
  } catch {
    /* no-op */
  }
}

export function getCallPostAnalysis(callId: string): PostCallAnalysisResult | null {
  return getStore().get(callId)?.postCallResult ?? null;
}

export function updateCallSessionMetadata(
  callId: string,
  patch: Partial<CallSessionMetadata>
): { ok: true } | { ok: false } {
  try {
    const s = getStore().get(callId);
    if (!s) return { ok: false };
    s.metadata = { ...s.metadata, ...patch };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function _resetCallStoreForTests(): void {
  try {
    (globalThis as unknown as { __lecipmCallSessionStore?: Map<string, Internal> }).__lecipmCallSessionStore?.clear();
  } catch {
    /* ignore */
  }
}
