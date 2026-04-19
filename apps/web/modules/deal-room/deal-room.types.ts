/**
 * Deal room — structured collaboration context (not legal closing, not payments).
 */

import type { DealRoomPortalAccessLevel, DealRoomPortalCapability } from "./deal-room-portal.types";

export type DealRoomEntityType = "listing" | "lead" | "broker" | "booking" | "property";

export type DealRoomStatus =
  | "open"
  | "active"
  | "pending_review"
  | "paused"
  | "closed"
  | "archived";

export type DealRoomParticipantRole =
  | "admin"
  | "operator"
  | "broker"
  | "buyer"
  | "seller"
  | "host"
  | "guest"
  | "reviewer";

export type DealRoomAccessLevel = "read" | "comment" | "edit" | "manage";

export type DealRoom = {
  id: string;
  entityType: DealRoomEntityType;
  entityId: string;
  title: string;
  status: DealRoomStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type DealRoomParticipant = {
  id: string;
  dealRoomId: string;
  userId?: string;
  displayName: string;
  email?: string;
  role: DealRoomParticipantRole;
  accessLevel: DealRoomAccessLevel;
  joinedAt: string;
  /** Safe client portal — must be explicitly enabled */
  portalEnabled?: boolean;
  portalAccessLevel?: DealRoomPortalAccessLevel;
  allowedCapabilities?: DealRoomPortalCapability[];
  invitedAt?: string;
  lastSeenAt?: string;
  /** Opaque bearer for `/portal/deal-room/[roomId]?token=` */
  portalToken?: string;
};

export type DealRoomNoteAudience = "internal" | "portal";

export type DealRoomNote = {
  id: string;
  dealRoomId: string;
  authorId?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  /** Default internal — portal shows only audience === portal */
  audience?: DealRoomNoteAudience;
};

export type DealRoomTaskStatus = "todo" | "doing" | "done" | "blocked";

export type DealRoomTaskVisibility = "internal" | "portal";

export type DealRoomTask = {
  id: string;
  dealRoomId: string;
  title: string;
  description?: string;
  status: DealRoomTaskStatus;
  assignedTo?: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Default internal — portal lists only visibility === portal */
  visibility?: DealRoomTaskVisibility;
};

export type DealRoomActivityType =
  | "created"
  | "participant_added"
  | "participant_removed"
  | "note_added"
  | "note_updated"
  | "task_created"
  | "task_updated"
  | "meeting_created"
  | "document_added"
  | "status_changed"
  | "doc_requirement_created"
  | "doc_requirement_requested"
  | "doc_requirement_attached"
  | "doc_requirement_received"
  | "doc_requirement_under_review"
  | "doc_requirement_approved"
  | "doc_requirement_rejected"
  | "doc_requirement_status_changed"
  | "portal_access_enabled"
  | "portal_access_revoked"
  | "portal_document_uploaded"
  | "portal_note_added";

export type DealRoomActivity = {
  id: string;
  dealRoomId: string;
  type: DealRoomActivityType;
  actorId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type DealRoomMeetingProvider = "zoom" | "teams" | "manual";

export type DealRoomMeeting = {
  id: string;
  dealRoomId: string;
  provider: DealRoomMeetingProvider;
  url: string;
  title: string;
  scheduledAt?: string;
  createdAt: string;
  /** Portal shows only when true — default false for legacy rows */
  portalVisible?: boolean;
};

export type DealRoomDocumentKind = "placeholder" | "upload" | "external_link";

export type DealRoomDocument = {
  id: string;
  dealRoomId: string;
  title: string;
  kind: DealRoomDocumentKind;
  url?: string;
  uploadedBy?: string;
  createdAt: string;
};
