export type AssistantAnalyticsEvent =
  | "assistant_opened"
  | "assistant_message_sent"
  | "assistant_voice_started"
  | "assistant_voice_transcribed"
  | "assistant_search_executed"
  | "assistant_listing_explained"
  | "assistant_compare_used"
  | "assistant_help_intent_used"
  | "assistant_tts_used"
  | "assistant_voice_conversation_started"
  | "assistant_voice_conversation_ended"
  | "assistant_voice_language_changed";

export function trackAssistantEvent(
  eventType: AssistantAnalyticsEvent,
  meta?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname.slice(0, 2048);
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, path, meta: meta ?? {} }),
    keepalive: true,
  }).catch(() => {});
}
