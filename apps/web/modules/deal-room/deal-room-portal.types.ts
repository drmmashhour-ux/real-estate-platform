/**
 * Client-facing deal room portal — limited V1; not a full extranet.
 */

export type DealRoomPortalAccessLevel =
  | "portal_read"
  | "portal_comment"
  | "portal_upload"
  | "portal_limited_manage";

export type DealRoomPortalCapability =
  | "view_status"
  | "view_tasks"
  | "view_documents"
  | "upload_documents"
  | "view_meetings"
  | "view_safe_activity"
  /** Notes with audience portal (broker/operator); not internal notes */
  | "view_portal_notes"
  | "add_note_limited";

/** Declarative defaults per access level (merged with explicit overrides). */
export type DealRoomPortalVisibilityRule = {
  /** Only requirements with portalShared appear */
  documentsOnlyShared: true;
  /** Tasks must have visibility portal */
  tasksOnlyPortalFlag: true;
  /** Notes must have audience portal */
  notesOnlyPortalAudience: true;
  /** Meetings must have portalVisible */
  meetingsOnlyPortalFlag: true;
  /** Activity entries pass through safe mapper only */
  activitySafeMapperOnly: true;
};

export type DealRoomPortalParticipantView = {
  roomTitle: string;
  roomStatusLabel: string;
  participantDisplayName: string;
  contactHint: string;
  capabilities: DealRoomPortalCapability[];
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt?: string;
  }>;
  documentRequirements: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    /** No internal ops notes */
    canUpload: boolean;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    scheduledAt?: string;
    joinUrl: string;
    provider: string;
  }>;
  safeActivity: Array<{
    id: string;
    label: string;
    createdAt: string;
  }>;
  portalNotes: Array<{
    id: string;
    body: string;
    createdAt: string;
  }>;
};
