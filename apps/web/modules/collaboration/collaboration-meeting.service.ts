/**
 * Meeting link factory — mock / env-based URLs until Zoom & Teams APIs are wired.
 */

import { randomUUID } from "crypto";

import type {
  CollaborationEntityType,
  CollaborationSession,
  CollaborationSessionType,
} from "./collaboration.types";
import { recordCollaborationMeetingCreated } from "./collaboration-monitoring.service";
import { appendSession } from "./collaboration-session.store";

function zoomBase(): string {
  return (
    process.env.COLLABORATION_ZOOM_MEETING_BASE?.trim() ||
    process.env.NEXT_PUBLIC_COLLABORATION_ZOOM_MEETING_BASE?.trim() ||
    "https://zoom.us/j/00000000000"
  );
}

function teamsBase(): string {
  return (
    process.env.COLLABORATION_TEAMS_MEETING_BASE?.trim() ||
    process.env.NEXT_PUBLIC_COLLABORATION_TEAMS_MEETING_BASE?.trim() ||
    "https://teams.microsoft.com/l/meetup-join/mock-thread"
  );
}

function safeMeetingUrl(
  base: string,
  sessionId: string,
  entityType: CollaborationEntityType,
  entityId: string,
  mode: "now" | "schedule",
  provider: CollaborationSessionType,
): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}collab_session=${encodeURIComponent(sessionId)}&entity=${encodeURIComponent(`${entityType}:${entityId}`)}&mode=${encodeURIComponent(mode)}&provider=${encodeURIComponent(provider)}`;
}

export function createZoomMeeting(args: {
  entityType: CollaborationEntityType;
  entityId: string;
  createdBy: string;
  mode?: "now" | "schedule";
}): CollaborationSession {
  const mode = args.mode ?? "now";
  const id = `collab_sess_${randomUUID()}`;
  const meetingUrl = safeMeetingUrl(zoomBase(), id, args.entityType, args.entityId, mode, "zoom");
  const session: CollaborationSession = {
    id,
    type: "zoom",
    entityType: args.entityType,
    entityId: args.entityId,
    createdBy: args.createdBy,
    meetingUrl,
    createdAt: new Date().toISOString(),
    mode,
  };
  appendSession(session);
  recordCollaborationMeetingCreated("zoom");
  return session;
}

export function createTeamsMeeting(args: {
  entityType: CollaborationEntityType;
  entityId: string;
  createdBy: string;
  mode?: "now" | "schedule";
}): CollaborationSession {
  const mode = args.mode ?? "schedule";
  const id = `collab_sess_${randomUUID()}`;
  const meetingUrl = safeMeetingUrl(teamsBase(), id, args.entityType, args.entityId, mode, "teams");
  const session: CollaborationSession = {
    id,
    type: "teams",
    entityType: args.entityType,
    entityId: args.entityId,
    createdBy: args.createdBy,
    meetingUrl,
    createdAt: new Date().toISOString(),
    mode,
  };
  appendSession(session);
  recordCollaborationMeetingCreated("teams");
  return session;
}
