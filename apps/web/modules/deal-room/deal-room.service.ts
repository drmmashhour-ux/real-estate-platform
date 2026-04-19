/**
 * Deal room orchestration — file-backed, auditable, no financial side effects.
 */

import { randomUUID } from "crypto";

import type { PlatformRole } from "@prisma/client";

import { createTeamsMeeting, createZoomMeeting } from "@/modules/collaboration/collaboration-meeting.service";

import {
  canComment,
  canEditTasksAndDocs,
  canManageDealRoom,
  canAccessDealRoom,
} from "./deal-room-access";
import {
  recordDealRoomClosed,
  recordDealRoomCreated,
  recordDealRoomDocumentAdded,
  recordDealRoomMeetingCreated,
  recordDealRoomNoteAdded,
  recordDealRoomParticipantAdded,
  recordDealRoomTaskCompleted,
  recordDealRoomTaskCreated,
} from "./deal-room-monitoring.service";
import {
  buildDocumentPacketSummary,
  listDocumentRequirements,
  listMissingRequiredDocuments,
} from "./deal-room-document-workflow.service";
import {
  activitiesForRoom,
  documentsForRoom,
  getParticipant,
  getRoom,
  listRooms,
  meetingsForRoom,
  notesForRoom,
  participantIdsForRoom,
  pushActivity,
  pushDocument,
  pushMeeting,
  pushNote,
  pushTask,
  removeParticipantRecord,
  tasksForRoom,
  updateNoteInPlace,
  updateTaskInPlace,
  upsertParticipant,
  upsertRoom,
} from "./deal-room.store";
import type {
  DealRoom,
  DealRoomAccessLevel,
  DealRoomActivityType,
  DealRoomDocumentKind,
  DealRoomEntityType,
  DealRoomMeetingProvider,
  DealRoomNote,
  DealRoomParticipant,
  DealRoomParticipantRole,
  DealRoomStatus,
  DealRoomTask,
  DealRoomTaskStatus,
} from "./deal-room.types";

export { resetDealRoomStoreForTests } from "./deal-room.store";

function ts(): string {
  return new Date().toISOString();
}

export function buildDealRoomTitle(entityType: DealRoomEntityType, entityId: string, hint?: string): string {
  if (hint?.trim()) return `Deal Room · ${hint.trim()}`;
  const short = entityId.length > 10 ? `${entityId.slice(0, 8)}…` : entityId;
  switch (entityType) {
    case "listing":
      return `Deal Room · Listing ${short}`;
    case "lead":
      return `Deal Room · Lead ${short}`;
    case "broker":
      return `Deal Room · Broker ${short}`;
    case "booking":
      return `Deal Room · Booking ${short}`;
    case "property":
      return `Deal Room · Property ${short}`;
    default:
      return `Deal Room · ${short}`;
  }
}

function mapPlatformToParticipantRole(role: PlatformRole): DealRoomParticipantRole {
  return role === "ADMIN" ? "admin" : "broker";
}

function activity(args: {
  dealRoomId: string;
  type: DealRoomActivityType;
  actorId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): void {
  pushActivity({
    id: `dra_${randomUUID()}`,
    dealRoomId: args.dealRoomId,
    type: args.type,
    actorId: args.actorId,
    summary: args.summary,
    metadata: args.metadata,
    createdAt: ts(),
  });
}

export function listDealRoomsVisibleToUser(args: { userId: string; userRole: PlatformRole }): DealRoom[] {
  const all = listRooms();
  if (args.userRole === "ADMIN") return all;
  return all.filter((r) => {
    if (r.createdBy === args.userId) return true;
    for (const pid of participantIdsForRoom(r.id)) {
      const p = getParticipant(pid);
      if (p?.userId === args.userId) return true;
    }
    return false;
  });
}

export function listDealRoomsByEntity(entityType: DealRoomEntityType, entityId: string): DealRoom[] {
  return listRooms().filter((r) => r.entityType === entityType && r.entityId === entityId);
}

export function createDealRoom(args: {
  entityType: DealRoomEntityType;
  entityId: string;
  title?: string;
  titleHint?: string;
  createdBy: string;
  creatorRole: PlatformRole;
  creatorDisplayName: string;
  creatorEmail?: string;
}): { ok: true; room: DealRoom } | { ok: false; error: string } {
  if (!roleIsBrokerOrAdmin(args.creatorRole)) {
    return { ok: false, error: "Only broker or admin can create a deal room." };
  }

  const id = `dr_${randomUUID()}`;
  const at = ts();
  const title = args.title?.trim() || buildDealRoomTitle(args.entityType, args.entityId, args.titleHint);

  const room: DealRoom = {
    id,
    entityType: args.entityType,
    entityId: args.entityId,
    title,
    status: "open",
    createdBy: args.createdBy,
    createdAt: at,
    updatedAt: at,
  };
  upsertRoom(room);

  const part: DealRoomParticipant = {
    id: `drp_${randomUUID()}`,
    dealRoomId: id,
    userId: args.createdBy,
    displayName: args.creatorDisplayName.trim() || "Creator",
    email: args.creatorEmail?.trim(),
    role: mapPlatformToParticipantRole(args.creatorRole),
    accessLevel: "manage",
    joinedAt: at,
  };
  upsertParticipant(part);

  activity({
    dealRoomId: id,
    type: "created",
    actorId: args.createdBy,
    summary: `Deal room created — ${title}`,
    metadata: { entityType: args.entityType, entityId: args.entityId },
  });

  recordDealRoomCreated();
  recordDealRoomParticipantAdded();
  return { ok: true, room };
}

function roleIsBrokerOrAdmin(role: PlatformRole): boolean {
  return role === "ADMIN" || role === "BROKER";
}

function roleCanCreateCollaborationDealRoom(role: PlatformRole): boolean {
  return roleIsBrokerOrAdmin(role) || role === "MORTGAGE_BROKER" || roleIsInternalOperator(role);
}

export function getDealRoom(id: string): DealRoom | undefined {
  return getRoom(id);
}

export function updateDealRoomStatus(args: {
  roomId: string;
  status: DealRoomStatus;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canManageDealRoom({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Not allowed to change status." };
  }
  const prev = room.status;
  upsertRoom({ ...room, status: args.status, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "status_changed",
    actorId: args.actorId,
    summary: `Status ${prev} → ${args.status}`,
    metadata: { from: prev, to: args.status },
  });
  if (args.status === "closed" || args.status === "archived") {
    recordDealRoomClosed();
  }
  return { ok: true };
}

export function addParticipant(args: {
  roomId: string;
  displayName: string;
  email?: string;
  userId?: string;
  role: DealRoomParticipantRole;
  accessLevel: DealRoomAccessLevel;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; participantId: string } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canManageDealRoom({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Not allowed to add participants." };
  }
  const pid = `drp_${randomUUID()}`;
  upsertParticipant({
    id: pid,
    dealRoomId: args.roomId,
    userId: args.userId,
    displayName: args.displayName.trim(),
    email: args.email?.trim(),
    role: args.role,
    accessLevel: args.accessLevel,
    joinedAt: ts(),
  });
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "participant_added",
    actorId: args.actorId,
    summary: `Participant added: ${args.displayName.trim()} (${args.role})`,
    metadata: { participantId: pid },
  });
  recordDealRoomParticipantAdded();
  return { ok: true, participantId: pid };
}

export function removeParticipant(args: {
  roomId: string;
  participantId: string;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canManageDealRoom({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Not allowed." };
  }
  const p = getParticipant(args.participantId);
  if (!p || p.dealRoomId !== args.roomId) return { ok: false, error: "Participant not in room." };
  removeParticipantRecord(args.participantId);
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "participant_removed",
    actorId: args.actorId,
    summary: `Participant removed: ${p.displayName}`,
  });
  return { ok: true };
}

export function addNote(args: {
  roomId: string;
  body: string;
  authorId: string;
  authorRole: PlatformRole;
  audience?: DealRoomNote["audience"];
}): { ok: true; note: DealRoomNote } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canComment({ userId: args.authorId, userRole: args.authorRole, room })) {
    return { ok: false, error: "Cannot add notes in this room." };
  }
  const note: DealRoomNote = {
    id: `drn_${randomUUID()}`,
    dealRoomId: args.roomId,
    authorId: args.authorId,
    body: args.body.trim(),
    audience: args.audience ?? "internal",
    createdAt: ts(),
    updatedAt: ts(),
  };
  if (!note.body) return { ok: false, error: "Note empty." };
  pushNote(note);
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "note_added",
    actorId: args.authorId,
    summary: `Note added (${note.body.slice(0, 80)}${note.body.length > 80 ? "…" : ""})`,
    metadata: { noteId: note.id },
  });
  recordDealRoomNoteAdded();
  return { ok: true, note };
}

export function updateNote(args: {
  roomId: string;
  noteId: string;
  body: string;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canComment({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot edit notes." };
  }
  const cur = notesForRoom(args.roomId).find((n) => n.id === args.noteId);
  if (!cur) return { ok: false, error: "Note not found." };
  if (cur.authorId && cur.authorId !== args.actorId && args.actorRole !== "ADMIN") {
    return { ok: false, error: "Can only edit your own notes unless admin." };
  }
  const next: DealRoomNote = {
    ...cur,
    body: args.body.trim(),
    updatedAt: ts(),
  };
  updateNoteInPlace(next);
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "note_updated",
    actorId: args.actorId,
    summary: "Note updated",
    metadata: { noteId: args.noteId },
  });
  return { ok: true };
}

export function listNotes(roomId: string): DealRoomNote[] {
  return notesForRoom(roomId);
}

export function createTask(args: {
  roomId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueAt?: string;
  visibility?: DealRoomTask["visibility"];
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; taskId: string } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot create tasks." };
  }
  const tid = `drt_${randomUUID()}`;
  const at = ts();
  pushTask({
    id: tid,
    dealRoomId: args.roomId,
    title: args.title.trim(),
    description: args.description?.trim(),
    status: "todo",
    assignedTo: args.assignedTo,
    dueAt: args.dueAt,
    visibility: args.visibility ?? "internal",
    createdAt: at,
    updatedAt: at,
  });
  upsertRoom({ ...room, updatedAt: at });
  activity({
    dealRoomId: args.roomId,
    type: "task_created",
    actorId: args.actorId,
    summary: `Task: ${args.title.trim()}`,
    metadata: { taskId: tid },
  });
  recordDealRoomTaskCreated();
  return { ok: true, taskId: tid };
}

export function updateTask(args: {
  roomId: string;
  taskId: string;
  title?: string;
  description?: string;
  status?: DealRoomTaskStatus;
  assignedTo?: string | null;
  dueAt?: string | null;
  visibility?: DealRoomTask["visibility"];
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot update tasks." };
  }
  const cur = tasksForRoom(args.roomId).find((t) => t.id === args.taskId);
  if (!cur) return { ok: false, error: "Task not found." };
  const prevStatus = cur.status;
  const nextStatus = args.status ?? cur.status;
  const updated: typeof cur = {
    ...cur,
    title: args.title?.trim() ?? cur.title,
    description: args.description !== undefined ? args.description?.trim() : cur.description,
    status: nextStatus,
    assignedTo:
      args.assignedTo !== undefined ? (args.assignedTo === null ? undefined : args.assignedTo) : cur.assignedTo,
    dueAt: args.dueAt === null ? undefined : args.dueAt ?? cur.dueAt,
    visibility: args.visibility !== undefined ? args.visibility : cur.visibility,
    updatedAt: ts(),
  };
  updateTaskInPlace(updated);
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "task_updated",
    actorId: args.actorId,
    summary:
      prevStatus !== nextStatus ? `Task ${nextStatus}` : `Task updated: ${updated.title}`,
    metadata: { taskId: args.taskId },
  });
  if (prevStatus !== "done" && nextStatus === "done") {
    recordDealRoomTaskCompleted();
  }
  return { ok: true };
}

export function listTasks(roomId: string) {
  return tasksForRoom(roomId);
}

export function listActivities(roomId: string) {
  return activitiesForRoom(roomId);
}

export function createDealRoomMeeting(args: {
  roomId: string;
  provider: DealRoomMeetingProvider;
  title: string;
  scheduledAt?: string;
  manualUrl?: string;
  /** When true, meeting appears in client portal (safe metadata only). */
  portalVisible?: boolean;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; meetingId: string; url: string } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot add meetings." };
  }

  let url = "";
  if (args.provider === "manual") {
    url = args.manualUrl?.trim() ?? "";
    if (!url) return { ok: false, error: "Manual URL required." };
  } else if (args.provider === "zoom") {
    const s = createZoomMeeting({
      entityType: "deal_room",
      entityId: args.roomId,
      createdBy: args.actorId,
      mode: args.scheduledAt ? "schedule" : "now",
    });
    url = s.meetingUrl;
  } else {
    const s = createTeamsMeeting({
      entityType: "deal_room",
      entityId: args.roomId,
      createdBy: args.actorId,
      mode: args.scheduledAt ? "schedule" : "schedule",
    });
    url = s.meetingUrl;
  }

  const mid = `drm_${randomUUID()}`;
  pushMeeting({
    id: mid,
    dealRoomId: args.roomId,
    provider: args.provider,
    url,
    title: args.title.trim() || "Meeting",
    scheduledAt: args.scheduledAt,
    portalVisible: args.portalVisible === true,
    createdAt: ts(),
  });
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "meeting_created",
    actorId: args.actorId,
    summary: `Meeting (${args.provider}): ${args.title}`,
    metadata: { meetingId: mid, url },
  });
  recordDealRoomMeetingCreated();
  return { ok: true, meetingId: mid, url };
}

export function listMeetings(roomId: string) {
  return meetingsForRoom(roomId);
}

export function addDocument(args: {
  roomId: string;
  title: string;
  kind: DealRoomDocumentKind;
  url?: string;
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; documentId: string } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canEditTasksAndDocs({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Cannot add documents." };
  }
  const did = `drdoc_${randomUUID()}`;
  pushDocument({
    id: did,
    dealRoomId: args.roomId,
    title: args.title.trim(),
    kind: args.kind,
    url: args.url?.trim(),
    uploadedBy: args.actorId,
    createdAt: ts(),
  });
  upsertRoom({ ...room, updatedAt: ts() });
  activity({
    dealRoomId: args.roomId,
    type: "document_added",
    actorId: args.actorId,
    summary: `Document: ${args.title.trim()} (${args.kind})`,
    metadata: { documentId: did },
  });
  recordDealRoomDocumentAdded();
  return { ok: true, documentId: did };
}

export function listDocuments(roomId: string) {
  return documentsForRoom(roomId);
}

export function assertCanViewRoom(args: {
  userId: string;
  userRole: PlatformRole;
  room: DealRoom;
}): boolean {
  return canAccessDealRoom({
    userId: args.userId,
    userRole: args.userRole,
    room: args.room,
  });
}

export function listParticipants(roomId: string): DealRoomParticipant[] {
  const out: DealRoomParticipant[] = [];
  for (const pid of participantIdsForRoom(roomId)) {
    const p = getParticipant(pid);
    if (p) out.push(p);
  }
  return out.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export function getDealRoomBundle(roomId: string):
  | {
      room: DealRoom;
      participants: DealRoomParticipant[];
      notes: DealRoomNote[];
      tasks: ReturnType<typeof listTasks>;
      activities: ReturnType<typeof listActivities>;
      meetings: ReturnType<typeof listMeetings>;
      documents: ReturnType<typeof listDocuments>;
      documentRequirements: ReturnType<typeof listDocumentRequirements>;
      packetSummary: ReturnType<typeof buildDocumentPacketSummary>;
      missingRequiredDocuments: ReturnType<typeof listMissingRequiredDocuments>;
    }
  | undefined {
  const room = getRoom(roomId);
  if (!room) return undefined;
  return {
    room,
    participants: listParticipants(roomId),
    notes: listNotes(roomId),
    tasks: listTasks(roomId),
    activities: listActivities(roomId),
    meetings: listMeetings(roomId),
    documents: listDocuments(roomId),
    documentRequirements: listDocumentRequirements(roomId),
    packetSummary: buildDocumentPacketSummary(roomId),
    missingRequiredDocuments: listMissingRequiredDocuments(roomId),
  };
}
