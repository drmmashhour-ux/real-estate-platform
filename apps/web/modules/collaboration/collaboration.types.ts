/**
 * Lightweight collaboration helpers — external Zoom / Teams links + internal notes only.
 * Not a chat product; no recording or auto-dial (see docs/collaboration-layer.md).
 */

export type CollaborationSessionType = "zoom" | "teams";

export type CollaborationEntityType = "listing" | "lead" | "broker" | "deal_room";

export type CollaborationSession = {
  id: string;
  type: CollaborationSessionType;
  entityType: CollaborationEntityType;
  entityId: string;
  createdBy: string;
  meetingUrl: string;
  createdAt: string;
  /** Optional flag for audit — scheduled vs immediate link generation */
  mode?: "now" | "schedule";
};

export type CollaborationNote = {
  id: string;
  entityType: CollaborationEntityType;
  entityId: string;
  body: string;
  createdBy: string;
  createdAt: string;
};
