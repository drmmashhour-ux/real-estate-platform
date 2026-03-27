/**
 * Future: email / push / in-app notification center. Stubs only — no external dispatch.
 */

const logNotifications =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENV === "staging";

export function notifyNewMessage(_params: {
  conversationId: string;
  messageId: string;
  recipientUserIds: string[];
}): void {
  if (logNotifications) {
    // eslint-disable-next-line no-console
    console.log("[messaging-notifications] notifyNewMessage (stub)", _params.conversationId);
  }
}

export function notifyUnreadConversation(_params: { conversationId: string; userId: string }): void {
  if (logNotifications) {
    // eslint-disable-next-line no-console
    console.log("[messaging-notifications] notifyUnreadConversation (stub)", _params);
  }
}

export function notifyConversationCreated(_params: { conversationId: string; userId: string }): void {
  if (logNotifications) {
    // eslint-disable-next-line no-console
    console.log("[messaging-notifications] notifyConversationCreated (stub)", _params);
  }
}
