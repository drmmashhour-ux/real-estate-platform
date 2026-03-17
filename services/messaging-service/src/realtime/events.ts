import { EventEmitter } from "events";

/**
 * In-process event bus for new messages. A real-time layer (e.g. WebSocket server, Pusher)
 * can subscribe and push to connected clients.
 * Usage: messageEvents.on("message", (payload) => { ... broadcast to conversation participants ... })
 */
export const messageEvents = new EventEmitter();
messageEvents.setMaxListeners(100);

export interface NewMessagePayload {
  conversationId: string;
  messageId: string;
  senderId: string;
  body: string;
  createdAt: string;
  attachmentCount: number;
}

export function emitNewMessage(payload: NewMessagePayload): void {
  messageEvents.emit("message", payload);
}
