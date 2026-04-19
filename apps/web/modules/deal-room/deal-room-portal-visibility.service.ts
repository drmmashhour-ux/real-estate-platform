/**
 * Filters server-side payload for external portal viewers — deny-by-default.
 *
 * Safety (V1): internal notes/tasks/activity/meetings/requirements stay hidden unless
 * explicitly flagged for portal (`audience === "portal"`, `visibility === "portal"`,
 * `portalVisible`, `portalShared`). Undefined legacy fields default to internal/not shared.
 */

import type { DealRoomActivity } from "./deal-room.types";
import type { DealRoomPortalParticipantView } from "./deal-room-portal.types";
import { mergeParticipantCapabilities, participantHasCapability } from "./deal-room-portal-capabilities";
import type { DealRoomParticipant } from "./deal-room.types";
import {
  activitiesForRoom,
  getRoom,
  meetingsForRoom,
  notesForRoom,
  requirementsForRoom,
  tasksForRoom,
} from "./deal-room.store";

export const PORTAL_CONTACT_HINT =
  "Questions? Contact your broker or agent directly. This page shows only information shared with you.";

function roomStatusPublicLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "active":
      return "Active";
    case "pending_review":
      return "In review";
    case "paused":
      return "Paused";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

function safeActivityLabel(a: DealRoomActivity): string | null {
  switch (a.type) {
    case "status_changed":
      return "Progress update";
    case "doc_requirement_requested":
      return "A document request was updated";
    case "doc_requirement_received":
      return "A document was received";
    case "doc_requirement_attached":
    case "portal_document_uploaded":
      return "A document was submitted";
    case "meeting_created":
      return "A meeting link was shared";
    case "doc_requirement_under_review":
      return "Something is being reviewed";
    case "doc_requirement_approved":
      return "An item was confirmed";
    case "doc_requirement_rejected":
      return "Feedback was requested on an item";
    case "portal_access_enabled":
    case "portal_access_revoked":
      return "Access was updated";
    case "portal_note_added":
      return "A message was added";
    default:
      return null;
  }
}

export function buildPortalParticipantView(participant: DealRoomParticipant): DealRoomPortalParticipantView | null {
  const room = getRoom(participant.dealRoomId);
  if (!room || participant.portalEnabled !== true) return null;

  const caps = mergeParticipantCapabilities({
    level: participant.portalAccessLevel ?? "portal_read",
    explicit: participant.allowedCapabilities,
  });

  const roomId = participant.dealRoomId;

  const tasks = participantHasCapability(caps, "view_tasks")
    ? tasksForRoom(roomId)
        .filter((t) => (t.visibility ?? "internal") === "portal")
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dueAt: t.dueAt,
        }))
    : [];

  const reqs = participantHasCapability(caps, "view_documents")
    ? requirementsForRoom(roomId).filter((r) => (r.portalShared ?? false) === true)
    : [];

  const documentRequirements = reqs.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    canUpload:
      participantHasCapability(caps, "upload_documents") &&
      ["missing", "requested", "rejected"].includes(r.status),
  }));

  const meetings = participantHasCapability(caps, "view_meetings")
    ? meetingsForRoom(roomId)
        .filter((m) => m.portalVisible === true)
        .map((m) => ({
          id: m.id,
          title: m.title,
          scheduledAt: m.scheduledAt,
          joinUrl: m.url,
          provider: m.provider,
        }))
    : [];

  const safeActivity = participantHasCapability(caps, "view_safe_activity")
    ? activitiesForRoom(roomId)
        .map((a) => {
          const label = safeActivityLabel(a);
          return label ? { id: a.id, label, createdAt: a.createdAt } : null;
        })
        .filter((x): x is { id: string; label: string; createdAt: string } => Boolean(x))
        .slice(0, 80)
    : [];

  const showPortalNotes =
    participantHasCapability(caps, "view_portal_notes") ||
    participantHasCapability(caps, "add_note_limited");

  const portalNotes = showPortalNotes
    ? notesForRoom(roomId)
        .filter((n) => (n.audience ?? "internal") === "portal")
        .map((n) => ({
          id: n.id,
          body: n.body,
          createdAt: n.createdAt,
        }))
    : [];

  return {
    roomTitle: room.title,
    roomStatusLabel: participantHasCapability(caps, "view_status")
      ? roomStatusPublicLabel(room.status)
      : "—",
    participantDisplayName: participant.displayName,
    contactHint: PORTAL_CONTACT_HINT,
    capabilities: caps,
    tasks,
    documentRequirements,
    meetings,
    safeActivity,
    portalNotes,
  };
}
