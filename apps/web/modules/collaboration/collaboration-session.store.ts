import fs from "fs";
import path from "path";

import type { CollaborationSession } from "./collaboration.types";

type DocV1 = {
  version: 1;
  sessions: CollaborationSession[];
  updatedAt: string;
};

const memory: { doc: DocV1 } = {
  doc: { version: 1, sessions: [], updatedAt: new Date().toISOString() },
};

let loaded = false;

function defaultPath(): string {
  return path.join(process.cwd(), "data", "collaboration-sessions.json");
}

function envPath(): string | null {
  const raw = process.env.COLLABORATION_SESSIONS_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedPath(): string {
  return envPath() ?? defaultPath();
}

export function resetCollaborationSessionsStoreForTests(): void {
  memory.doc = { version: 1, sessions: [], updatedAt: new Date().toISOString() };
  loaded = true;
}

function load(): void {
  if (loaded) return;
  loaded = true;
  const fp = resolvedPath();
  if (!fs.existsSync(fp)) return;
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const p = JSON.parse(raw) as DocV1;
    if (p.version === 1 && Array.isArray(p.sessions)) memory.doc = p;
  } catch {
    /* ignore */
  }
}

function persist(): void {
  const fp = resolvedPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    memory.doc.updatedAt = new Date().toISOString();
    fs.writeFileSync(fp, `${JSON.stringify(memory.doc, null, 2)}\n`, "utf8");
  } catch {
    /* ignore */
  }
}

export function appendSession(s: CollaborationSession): void {
  load();
  memory.doc.sessions.unshift(s);
  persist();
}

export function listSessions(): CollaborationSession[] {
  load();
  return [...memory.doc.sessions];
}
