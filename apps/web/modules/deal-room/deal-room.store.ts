/**
 * File-backed deal room state — V1 practical persistence (JSON).
 */

import fs from "fs";
import path from "path";

import type {
  DealRoom,
  DealRoomActivity,
  DealRoomDocument,
  DealRoomMeeting,
  DealRoomNote,
  DealRoomParticipant,
  DealRoomTask,
} from "./deal-room.types";
import type { DealRoomDocumentRequirement } from "./deal-room-document-workflow.types";

export type DealRoomDocV1 = {
  version: 1;
  rooms: Record<string, DealRoom>;
  participantIdsByRoom: Record<string, string[]>;
  participants: Record<string, DealRoomParticipant>;
  notes: DealRoomNote[];
  tasks: DealRoomTask[];
  activities: DealRoomActivity[];
  meetings: DealRoomMeeting[];
  documents: DealRoomDocument[];
  updatedAt: string;
};

const memory: { doc: DealRoomDocV1 } = {
  doc: {
    version: 1,
    rooms: {},
    participantIdsByRoom: {},
    participants: {},
    notes: [],
    tasks: [],
    activities: [],
    meetings: [],
    documents: [],
    updatedAt: new Date().toISOString(),
  },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), "data", "deal-rooms.json");
}

function envPath(): string | null {
  const raw = process.env.DEAL_ROOMS_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function resetDealRoomStoreForTests(): void {
  memory.doc = {
    version: 1,
    rooms: {},
    participantIdsByRoom: {},
    participants: {},
    notes: [],
    tasks: [],
    activities: [],
    meetings: [],
    documents: [],
    documentRequirements: [],
    updatedAt: nowIso(),
  };
  loaded = true;
}

function load(): void {
  if (loaded) return;
  loaded = true;
  const fp = resolvedPath();
  if (!fs.existsSync(fp)) return;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const p = JSON.parse(raw) as DealRoomDocV1;
    if (p.version === 1 && p.rooms && typeof p.rooms === "object") {
      memory.doc = {
        ...memory.doc,
        ...p,
        notes: Array.isArray(p.notes) ? p.notes : [],
        tasks: Array.isArray(p.tasks) ? p.tasks : [],
        activities: Array.isArray(p.activities) ? p.activities : [],
        meetings: Array.isArray(p.meetings) ? p.meetings : [],
        documents: Array.isArray(p.documents) ? p.documents : [],
        documentRequirements: Array.isArray(p.documentRequirements) ? p.documentRequirements : [],
      };
    }
  } catch {
    /* ignore */
  }
}

function persist(): void {
  const fp = resolvedPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    memory.doc.updatedAt = nowIso();
    fs.writeFileSync(fp, `${JSON.stringify(memory.doc, null, 2)}\n`, "utf8");
  } catch {
    /* ignore */
  }
}

export function getRoom(id: string): DealRoom | undefined {
  load();
  return memory.doc.rooms[id];
}

export function upsertRoom(r: DealRoom): void {
  load();
  memory.doc.rooms[r.id] = r;
  persist();
}

export function listRoomIds(): string[] {
  load();
  return Object.keys(memory.doc.rooms);
}

export function getParticipant(pid: string): DealRoomParticipant | undefined {
  load();
  return memory.doc.participants[pid];
}

export function upsertParticipant(p: DealRoomParticipant): void {
  load();
  memory.doc.participants[p.id] = p;
  const arr = memory.doc.participantIdsByRoom[p.dealRoomId] ?? [];
  if (!arr.includes(p.id)) {
    memory.doc.participantIdsByRoom[p.dealRoomId] = [...arr, p.id];
  }
  persist();
}

export function removeParticipantRecord(pid: string): void {
  load();
  const p = memory.doc.participants[pid];
  if (!p) return;
  delete memory.doc.participants[pid];
  const arr = memory.doc.participantIdsByRoom[p.dealRoomId] ?? [];
  memory.doc.participantIdsByRoom[p.dealRoomId] = arr.filter((x) => x !== pid);
  persist();
}

export function participantIdsForRoom(roomId: string): string[] {
  load();
  return memory.doc.participantIdsByRoom[roomId] ?? [];
}

/** Resolve external portal bearer — token must match enabled participant in this room only. */
export function findParticipantByPortalToken(roomId: string, token: string): DealRoomParticipant | undefined {
  load();
  const t = token.trim();
  if (!t) return undefined;
  for (const pid of participantIdsForRoom(roomId)) {
    const p = getParticipant(pid);
    if (p?.portalEnabled === true && p.portalToken === t && p.dealRoomId === roomId) return p;
  }
  return undefined;
}

export function pushNote(n: DealRoomNote): void {
  load();
  memory.doc.notes.unshift(n);
  persist();
}

export function updateNoteInPlace(n: DealRoomNote): void {
  load();
  const i = memory.doc.notes.findIndex((x) => x.id === n.id);
  if (i >= 0) {
    memory.doc.notes[i] = n;
    persist();
  }
}

export function notesForRoom(roomId: string): DealRoomNote[] {
  load();
  return memory.doc.notes.filter((n) => n.dealRoomId === roomId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pushTask(t: DealRoomTask): void {
  load();
  memory.doc.tasks.unshift(t);
  persist();
}

export function updateTaskInPlace(t: DealRoomTask): void {
  load();
  const i = memory.doc.tasks.findIndex((x) => x.id === t.id);
  if (i >= 0) {
    memory.doc.tasks[i] = t;
    persist();
  }
}

export function tasksForRoom(roomId: string): DealRoomTask[] {
  load();
  return memory.doc.tasks.filter((t) => t.dealRoomId === roomId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function pushActivity(a: DealRoomActivity): void {
  load();
  memory.doc.activities.unshift(a);
  persist();
}

export function activitiesForRoom(roomId: string): DealRoomActivity[] {
  load();
  return memory.doc.activities.filter((a) => a.dealRoomId === roomId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pushMeeting(m: DealRoomMeeting): void {
  load();
  memory.doc.meetings.unshift(m);
  persist();
}

export function meetingsForRoom(roomId: string): DealRoomMeeting[] {
  load();
  return memory.doc.meetings.filter((m) => m.dealRoomId === roomId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pushDocument(d: DealRoomDocument): void {
  load();
  memory.doc.documents.unshift(d);
  persist();
}

export function documentsForRoom(roomId: string): DealRoomDocument[] {
  load();
  return memory.doc.documents.filter((d) => d.dealRoomId === roomId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDocumentById(id: string): DealRoomDocument | undefined {
  load();
  return memory.doc.documents.find((d) => d.id === id);
}

export function pushDocumentRequirement(r: DealRoomDocumentRequirement): void {
  load();
  if (!Array.isArray(memory.doc.documentRequirements)) {
    memory.doc.documentRequirements = [];
  }
  memory.doc.documentRequirements.unshift(r);
  persist();
}

export function updateDocumentRequirementInPlace(r: DealRoomDocumentRequirement): void {
  load();
  if (!Array.isArray(memory.doc.documentRequirements)) {
    memory.doc.documentRequirements = [];
  }
  const i = memory.doc.documentRequirements.findIndex((x) => x.id === r.id);
  if (i >= 0) {
    memory.doc.documentRequirements[i] = r;
    persist();
  }
}

export function requirementsForRoom(roomId: string): DealRoomDocumentRequirement[] {
  load();
  const arr = memory.doc.documentRequirements ?? [];
  return arr.filter((x) => x.dealRoomId === roomId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listRooms(): DealRoom[] {
  load();
  return Object.values(memory.doc.rooms).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
