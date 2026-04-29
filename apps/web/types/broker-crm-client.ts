/** Broker CRM — mirrored Prisma enums + slim row shapes for client bundles. */

export type BrokerClientStatus =
  | "LEAD"
  | "CONTACTED"
  | "QUALIFIED"
  | "VIEWING"
  | "NEGOTIATING"
  | "UNDER_CONTRACT"
  | "CLOSED"
  | "LOST";

export type BrokerInteractionType =
  | "NOTE"
  | "EMAIL"
  | "CALL"
  | "MEETING"
  | "TASK"
  | "FOLLOW_UP"
  | "STATUS_CHANGE";

export type BrokerClientListingKind = "SAVED" | "SHARED" | "VIEWED" | "FAVORITE";

/** Minimal interaction rows for timelines (Pick<BrokerClientInteraction, …> equivalent). */
export type BrokerClientInteractionTimelineRow = {
  id: string;
  type: BrokerInteractionType;
  title?: string | null;
  message?: string | null;
  createdAt?: Date | string;
  dueAt?: Date | string | null;
  completedAt?: Date | string | null;
};
