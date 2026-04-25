import { getSessionInternalForAnalysis, getCallSession } from "@/modules/messaging/call/call-session.service";
import { callAiLog } from "@/modules/messaging/call/call-ai-logger";
import { redactForLog } from "@/lib/security/redact";

const MAX_T = 120_000;

/**
 * Attach a transcript (manual, Twilio, etc.) when the broker has consented to process it.
 * Core flows work with no transcript.
 * Never throws.
 */
export function attachTranscript(
  callId: string,
  transcriptText: string,
  options?: { transcriptProcessingConsent?: boolean }
): { ok: true } | { ok: false; error: string } {
  try {
    const s = getSessionInternalForAnalysis(callId);
    if (!s) return { ok: false, error: "Not found" };
    const granted = options?.transcriptProcessingConsent === true;
    if (!granted) {
      callAiLog.warn("transcript_rejected", { callId, reason: "no_consent" });
      return { ok: false, error: "Transcript requires explicit processing consent" };
    }
    const t = (transcriptText || "").trim();
    if (t.length === 0) return { ok: false, error: "Empty transcript" };
    s.transcriptText = t.length > MAX_T ? t.slice(-MAX_T) : t;
    s.metadata = { ...s.metadata, transcriptAvailable: true, transcriptProcessingConsent: true };
    callAiLog.transcriptAttached({
      callId,
      len: t.length,
      sample: String(redactForLog(t.slice(0, 80))),
    });
    return { ok: true };
  } catch (e) {
    callAiLog.warn("attachTranscript", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "Could not attach transcript" };
  }
}

/**
 * For downstream engines; returns undefined if none or not consented.
 */
export function getTranscriptText(callId: string): string | undefined {
  const row = getCallSession(callId);
  if (!row.ok) return undefined;
  if (!row.session.metadata.transcriptProcessingConsent) return undefined;
  return getSessionInternalForAnalysis(callId)?.transcriptText;
}
