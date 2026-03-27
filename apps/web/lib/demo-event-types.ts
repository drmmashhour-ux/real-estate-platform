export const DemoEvents = {
  LOGIN: "login",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  SESSION_DURATION: "session_duration",
  PAGE_VIEW: "page_view",

  VIEW_LISTING: "view_listing",
  CONTACT_BROKER: "contact_broker",
  CREATE_OFFER: "create_offer",
  EDIT_PROFILE: "edit_profile",

  SEARCH: "search",
  FILTER: "filter",

  BLOCKED_ACTION: "blocked_action",

  /** Optional: feature-level engagement */
  CLICK: "click",
  /** Optional: segment demo users */
  USER_TYPE: "user_type",

  /** Guided demo flow (staging) */
  DEMO_STEP: "demo_step",
  DEMO_COMPLETED: "demo_completed",
  DEMO_STARTED: "demo_started",
  DEMO_STEP_VIEWED: "demo_step_viewed",
  DEMO_SKIPPED: "demo_skipped",

  AI_DEAL_ANALYZER_USED: "ai_deal_analyzer_used",
  AI_DEAL_ANALYZER_COMPLETED: "ai_deal_analyzer_completed",

  MORTGAGE_SIMULATOR_USED: "mortgage_simulator_used",
  SCENARIO_ADDED: "scenario_added",
  SCENARIO_COMPARED: "scenario_compared",

  OFFER_STARTED: "offer_started",
  OFFER_SUBMITTED: "offer_submitted",
  OFFER_COUNTERED: "offer_countered",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_REJECTED: "offer_rejected",
  OFFER_WITHDRAWN: "offer_withdrawn",

  /** Broker CRM (staging analytics) */
  CRM_CLIENT_CREATED: "crm_client_created",
  CRM_CLIENT_UPDATED: "crm_client_updated",
  CRM_STATUS_CHANGED: "crm_status_changed",
  CRM_INTERACTION_ADDED: "crm_interaction_added",
  CRM_TASK_COMPLETED: "crm_task_completed",
  CRM_PIPELINE_VIEWED: "crm_pipeline_viewed",

  APPOINTMENT_REQUESTED: "appointment_requested",
  APPOINTMENT_CONFIRMED: "appointment_confirmed",
  APPOINTMENT_RESCHEDULED: "appointment_rescheduled",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  PROPERTY_VISIT_BOOKED: "property_visit_booked",
  CALENDAR_VIEWED: "calendar_viewed",

  /** In-app messaging (staging analytics) */
  CONVERSATION_CREATED: "conversation_created",
  MESSAGE_SENT: "message_sent",
  CONVERSATION_READ: "conversation_read",
  MESSAGES_INBOX_VIEWED: "messages_inbox_viewed",
  MESSAGE_BROKER_CLICKED: "message_broker_clicked",

  /** Document Center (staging analytics) */
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_DOWNLOADED: "document_downloaded",
  DOCUMENT_SHARED: "document_shared",
  DEAL_ROOM_VIEWED: "deal_room_viewed",
  DOCUMENT_CENTER_VIEWED: "document_center_viewed",

  /** Client intake / KYC checklist (staging) */
  INTAKE_PROFILE_CREATED: "intake_profile_created",
  INTAKE_TEMPLATE_APPLIED: "intake_template_applied",
  REQUIRED_DOCUMENT_REQUESTED: "required_document_requested",
  REQUIRED_DOCUMENT_UPLOADED: "required_document_uploaded",
  REQUIRED_DOCUMENT_APPROVED: "required_document_approved",
  REQUIRED_DOCUMENT_REJECTED: "required_document_rejected",
  INTAKE_COMPLETED: "intake_completed",
  INTAKE_PAGE_VIEWED: "intake_page_viewed",

  /** Internal notifications + action queue (staging) */
  NOTIFICATION_CREATED: "notification_created",
  NOTIFICATION_READ: "notification_read",
  NOTIFICATION_CENTER_VIEWED: "notification_center_viewed",
  ACTION_QUEUE_VIEWED: "action_queue_viewed",
  ACTION_QUEUE_COMPLETED: "action_queue_completed",
  ACTION_QUEUE_DISMISSED: "action_queue_dismissed",
} as const;

export type DemoEventName = (typeof DemoEvents)[keyof typeof DemoEvents];

const VALUES = new Set<string>(Object.values(DemoEvents));

export function isDemoEventName(value: string): value is DemoEventName {
  return VALUES.has(value);
}
