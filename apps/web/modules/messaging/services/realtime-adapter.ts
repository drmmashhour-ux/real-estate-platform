/**
 * Boundary for future WebSocket / SSE / Pusher. No transport wired in v1.
 */

export type ConversationRealtimePayload = {
  conversationId: string;
  kind: "message_created" | "read" | "archived";
  messageId?: string;
};

export function publishConversationUpdate(_payload: ConversationRealtimePayload): void {
  /* intentionally empty */
}

export function subscribeConversationChannel(
  _conversationId: string,
  _onEvent: (payload: ConversationRealtimePayload) => void
): () => void {
  return () => {
    /* unsubscribe no-op */
  };
}
