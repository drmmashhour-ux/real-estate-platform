/**
 * Lightweight internal notes keyed by collaboration entity — file-backed.
 */

import { randomUUID } from "crypto";

import type { CollaborationEntityType, CollaborationNote } from "./collaboration.types";
import { recordCollaborationNoteAdded } from "./collaboration-monitoring.service";
import { appendNote, listNotesForEntity } from "./collaboration-notes.store";

export function addCollaborationNote(args: {
  entityType: CollaborationEntityType;
  entityId: string;
  body: string;
  createdBy: string;
}): { ok: true; note: CollaborationNote } | { ok: false; error: string } {
  const body = args.body.trim();
  if (!body) return { ok: false, error: "Note cannot be empty." };

  const note: CollaborationNote = {
    id: `collab_note_${randomUUID()}`,
    entityType: args.entityType,
    entityId: args.entityId,
    body,
    createdBy: args.createdBy,
    createdAt: new Date().toISOString(),
  };
  appendNote(note);
  recordCollaborationNoteAdded();
  return { ok: true, note };
}

export function listCollaborationNotes(entityType: CollaborationEntityType, entityId: string): CollaborationNote[] {
  return listNotesForEntity(entityType, entityId);
}
