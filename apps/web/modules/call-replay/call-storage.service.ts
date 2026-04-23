import type { CallRecording, CallRecordingMetadata, SpeakerRole, TranscriptSegment } from "./call-replay.types";

const STORAGE_KEY = "lecipm-call-replay-store-v1";
const AUDIO_PREFIX = "lecipm-call-replay-audio:";

export type CallReplayStore = {
  recordings: Record<string, CallRecording>;
};

function emptyStore(): CallReplayStore {
  return { recordings: {} };
}

let memoryStore: CallReplayStore = emptyStore();

export function loadStore(): CallReplayStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memoryStore = { ...emptyStore(), ...JSON.parse(raw) } as CallReplayStore;
    } catch {
      /* keep memory */
    }
  }
  return memoryStore;
}

export function saveStore(store: CallReplayStore): void {
  memoryStore = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cr-${Date.now()}`;
}

export function segId(): string {
  return `seg-${uid()}`;
}

const MAX_AUDIO_STORAGE_BYTES = 4 * 1024 * 1024;

/** Persist optional audio as base64 in sessionStorage (user-controlled; warn on size). */
export function saveAudioForRecording(recordingId: string, base64: string, mimeType: string): { ok: boolean; error?: string } {
  if (base64.length * 0.75 > MAX_AUDIO_STORAGE_BYTES) {
    return { ok: false, error: "File too large for browser storage — keep audio local or use a shorter clip." };
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(`${AUDIO_PREFIX}${recordingId}`, JSON.stringify({ mimeType, data: base64 }));
    }
  } catch {
    return { ok: false, error: "Could not store audio in session." };
  }
  const store = loadStore();
  const r = store.recordings[recordingId];
  if (r) {
    r.audioStored = true;
    saveStore(store);
  }
  return { ok: true };
}

export function loadAudioForRecording(recordingId: string): { mimeType: string; data: string } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${AUDIO_PREFIX}${recordingId}`);
    if (!raw) return null;
    return JSON.parse(raw) as { mimeType: string; data: string };
  } catch {
    return null;
  }
}

export function removeAudioForRecording(recordingId: string): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(`${AUDIO_PREFIX}${recordingId}`);
  }
}

export function createRecording(input: {
  title: string;
  transcript: TranscriptSegment[];
  metadata: CallRecordingMetadata;
  durationSec?: number;
}): CallRecording {
  const recordingId = uid();
  const rec: CallRecording = {
    recordingId,
    title: input.title.trim() || "Untitled call",
    createdAtIso: new Date().toISOString(),
    transcript: input.transcript,
    durationSec: input.durationSec,
    metadata: input.metadata,
    segmentTags: {},
    coachComments: [],
  };
  const store = loadStore();
  store.recordings[recordingId] = rec;
  saveStore(store);
  return rec;
}

export function updateRecording(recordingId: string, patch: Partial<CallRecording>): CallRecording | null {
  const store = loadStore();
  const r = store.recordings[recordingId];
  if (!r) return null;
  Object.assign(r, patch);
  saveStore(store);
  return r;
}

export function getRecording(recordingId: string): CallRecording | undefined {
  return loadStore().recordings[recordingId];
}

export function listRecordings(): CallRecording[] {
  return Object.values(loadStore().recordings).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export function deleteRecording(recordingId: string): void {
  const store = loadStore();
  delete store.recordings[recordingId];
  saveStore(store);
  removeAudioForRecording(recordingId);
}

/** Parse pasted transcript: lines like "Rep: text" or "[0:15] Prospect: text" */
export function parseTranscriptPaste(raw: string): TranscriptSegment[] {
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: TranscriptSegment[] = [];
  let t = 0;
  const step = 12;

  for (const line of lines) {
    const timeMatch = line.match(/^\[(\d+):(\d+)\]\s*/);
    let startSec = t;
    if (timeMatch) {
      const mm = Number(timeMatch[1]);
      const ss = Number(timeMatch[2]);
      startSec = mm * 60 + ss;
    }
    const rest = timeMatch ? line.slice(timeMatch[0].length) : line;
    let speaker: SpeakerRole = "unknown";
    let text = rest;
    const lr = rest.match(/^(rep|broker|you|me)\s*:\s*/i);
    const lp = rest.match(/^(prospect|client|customer|they)\s*:\s*/i);
    if (lr) {
      speaker = "rep";
      text = rest.slice(lr[0].length);
    } else if (lp) {
      speaker = "prospect";
      text = rest.slice(lp[0].length);
    }
    const dur = Math.max(3, Math.ceil(text.split(/\s+/).filter(Boolean).length / 3));
    const endSec = startSec + dur;
    out.push({
      id: segId(),
      speaker,
      text,
      startSec,
      endSec,
    });
    t = endSec + step;
  }
  return out;
}
