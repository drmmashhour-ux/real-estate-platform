/**
 * Client portal sessions — opaque token auth, tightly scoped mutations.
 */

import { randomUUID } from "crypto";

import type { PlatformRole } from "@prisma/client";

import { canManageDealRoom } from "./deal-room-access";
import type { DealRoomPortalAccessLevel, DealRoomPortalCapability } from "./deal-room-portal.types";
import { mergeParticipantCapabilities, participantHasCapability } from "./deal-room-portal-capabilities";
import {
  recordPortalAccessDenied,
  recordPortalDocumentUpload,
  recordPortalAccessEnabled,
  recordPortalAccessRevoked,
  recordPortalParticipantAction,
  recordPortalPageView,
} from "./deal-room-portal-monitoring.service";
import { buildPortalParticipantView } from "./deal-room-portal-visibility.service";
import type { DealRoomActivityType } from "./deal-room.types";
import type { DealRoomDocumentKind } from "./deal-room.types";
import type { DealRoomParticipant } from "./deal-room.types";
import {
  findParticipantByPortalToken,
  getParticipant,
  getRoom,
  pushActivity,
  pushDocument,
  pushNote,
  requirementsForRoom,
  updateDocumentRequirementInPlace,
  upsertParticipant,
  upsertRoom,
} from "./deal-room.store";

function ts(): string {
  return new Date().toISOString();
}

function portalActivity(args: {
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

export function resolvePortalParticipant(roomId: string, token: string | null | undefined): DealRoomParticipant | null {
  if (!token?.trim()) {
    recordPortalAccessDenied("missing_token");
    return null;
  }
  const p = findParticipantByPortalToken(roomId, token);
  if (!p || p.portalEnabled !== true) {
    recordPortalAccessDenied("invalid_or_disabled");
    return null;
  }
  return p;
}

export function buildPortalPayload(participant: DealRoomParticipant) {
  return buildPortalParticipantView(participant);
}

export function touchPortalLastSeen(participantId: string): void {
  const p = getParticipant(participantId);
  if (!p) return;
  upsertParticipant({ ...p, lastSeenAt: ts() });
}

export function recordPortalViewOk(): void {
  recordPortalPageView();
}

export function updateParticipantPortalAccess(args: {
  roomId: string;
  participantId: string;
  enabled: boolean;
  accessLevel: DealRoomPortalAccessLevel;
  explicitCapabilities?: DealRoomPortalCapability[];
  actorId: string;
  actorRole: PlatformRole;
}): { ok: true; portalToken?: string } | { ok: false; error: string } {
  const room = getRoom(args.roomId);
  if (!room) return { ok: false, error: "Room not found." };
  if (!canManageDealRoom({ userId: args.actorId, userRole: args.actorRole, room })) {
    return { ok: false, error: "Only managers can change portal access." };
  }

  const cur = getParticipant(args.participantId);
  if (!cur || cur.dealRoomId !== args.roomId) return { ok: false, error: "Participant not found." };

  if (!args.enabled) {
    const next: DealRoomParticipant = {
      ...cur,
      portalEnabled: false,
      portalToken: undefined,
      portalAccessLevel: undefined,
      allowedCapabilities: undefined,
    };
    upsertParticipant(next);
    upsertRoom({ ...room, updatedAt: ts() });
    portalActivity({
      dealRoomId: args.roomId,
      type: "portal_access_revoked",
      actorId: args.actorId,
      summary: `Portal access revoked for ${cur.displayName}`,
      metadata: { participantId: cur.id },
    });
    recordPortalAccessRevoked();
    return { ok: true };
  }

  const caps = mergeParticipantCapabilities({
    level: args.accessLevel,
    explicit: args.explicitCapabilities,
  });

  let portalToken = cur.portalToken;
  if (!portalToken) {
    portalToken = `pt_${randomUUID().replace(/-/g, "")}`;
  }

  const next: DealRoomParticipant = {
    ...cur,
    portalEnabled: true,
    portalAccessLevel: args.accessLevel,
    allowedCapabilities: caps,
    portalToken,
    invitedAt: cur.invitedAt ?? ts(),
    lastSeenAt: cur.lastSeenAt,
  };

  upsertParticipant(next);
  upsertRoom({ ...room, updatedAt: ts() });

  portalActivity({
    dealRoomId: args.roomId,
    type: "portal_access_enabled",
    actorId: args.actorId,
    summary: `Portal access enabled for ${cur.displayName} (${args.accessLevel})`,
    metadata: { participantId: cur.id },
  });

  recordPortalAccessEnabled();
  return { ok: true, portalToken };
}

export function portalAttachDocument(args: {
  roomId: string;
  token: string;
  participantId: string;
  requirementId: string;
  title?: string;
  kind: DealRoomDocumentKind;
  url?: string;
}): { ok: true; documentId: string } | { ok: false; error: string } {
  const p = findParticipantByPortalToken(args.roomId, args.token);
  if (!p || p.portalEnabled !== true || p.id !== args.participantId) {
    recordPortalAccessDenied("portal_attach_denied");
    return { ok: false, error: "Unauthorized." };
  }

  const caps = mergeParticipantCapabilities({
    level: p.portalAccessLevel ?? "portal_read",
    explicit: p.allowedCapabilities,
  });

  if (!participantHasCapability(caps, "upload_documents")) {
    recordPortalAccessDenied("capability_upload");
    return { ok: false, error: "Upload not enabled for your access." };
  }

  const req = requirementsForRoom(args.roomId).find((r) => r.id === args.requirementId);
  if (!req || req.portalShared !== true) {
    recordPortalAccessDenied("requirement_not_shared");
    return { ok: false, error: "This item is not available for submission." };
  }

  const kind = args.kind;
  const url = args.url?.trim();
  if (kind !== "placeholder" && !url) {
    return { ok: false, error: "Link or file reference required." };
  }

  const docId = `drdoc_${randomUUID()}`;
  pushDocument({
    id: docId,
    dealRoomId: args.roomId,
    title: args.title?.trim() || req.title,
    kind,
    url,
    uploadedBy: `portal:${p.id}`,
    createdAt: ts(),
  });

  const nextStatus = req.status === "approved" ? "approved" : req.status === "under_review" ? "under_review" : "received";

  updateDocumentRequirementInPlace({
    ...req,
    attachedDocumentId: docId,
    status: nextStatus,
    updatedAt: ts(),
  });

  const room = getRoom(args.roomId);
  if (room) upsertRoom({ ...room, updatedAt: ts() });

  portalActivity({
    dealRoomId: args.roomId,
    type: "portal_document_uploaded",
    actorId: p.id,
    summary: `Portal upload: ${req.title}`,
    metadata: { requirementId: req.id, documentId: docId },
  });

  portalActivity({
    dealRoomId: args.roomId,
    type: "doc_requirement_attached",
    actorId: p.id,
    summary: `Document submitted for “${req.title}”`,
    metadata: { requirementId: req.id, documentId: docId, viaPortal: true },
  });

  recordPortalDocumentUpload();
  recordPortalParticipantAction("attach_document");
  return { ok: true, documentId: docId };
}

export function portalAddLimitedNote(args: {
  roomId: string;
  token: string;
  participantId: string;
  body: string;
}): { ok: true } | { ok: false; error: string } {
  const p = findParticipantByPortalToken(args.roomId, args.token);
  if (!p || p.portalEnabled !== true || p.id !== args.participantId) {
    recordPortalAccessDenied("portal_note_denied");
    return { ok: false, error: "Unauthorized." };
  }

  const caps = mergeParticipantCapabilities({
    level: p.portalAccessLevel ?? "portal_read",
    explicit: p.allowedCapabilities,
  });

  if (!participantHasCapability(caps, "add_note_limited")) {
    return { ok: false, error: "Messaging not enabled." };
  }

  const text = args.body.trim();
  if (!text || text.length > 4000) return { ok: false, error: "Message invalid." };

  pushNote({
    id: `drn_${randomUUID()}`,
    dealRoomId: args.roomId,
    authorId: `portal:${p.id}`,
    body: `[Portal] ${text}`,
    audience: "portal",
    createdAt: ts(),
    updatedAt: ts(),
  });

  const room = getRoom(args.roomId);
  if (room) upsertRoom({ ...room, updatedAt: ts() });

  portalActivity({
    dealRoomId: args.roomId,
    type: "portal_note_added",
    actorId: p.id,
    summary: "A portal message was added",
    metadata: {},
  });

  recordPortalParticipantAction("note");
  return { ok: true };
}
