/** DealRoomEvent.eventType — timeline discriminator */
export const DEAL_ROOM_EVENT = {
  DEAL_ROOM_CREATED: "deal_room_created",
  STAGE_CHANGED: "stage_changed",
  TASK_ADDED: "task_added",
  TASK_UPDATED: "task_updated",
  DOCUMENT_ADDED: "document_added",
  DOCUMENT_STATUS_UPDATED: "document_status_updated",
  PAYMENT_UPDATED: "payment_updated",
  NEXT_ACTION_UPDATED: "next_action_updated",
  MESSAGE_NOTE: "message_note",
  /** Linked visit / scheduling activity */
  VISIT_NOTE: "visit_note",
} as const;
