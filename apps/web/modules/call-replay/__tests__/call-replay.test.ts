import { describe, it, expect, beforeEach } from "vitest";

import { analyzeCallReplay } from "../call-replay-analysis.service";
import {
  createRecording,
  deleteRecording,
  listRecordings,
  parseTranscriptPaste,
  loadStore,
  saveStore,
  type CallReplayStore,
} from "../call-storage.service";
import { rewriteMoment } from "../call-replay-rewrite.service";
import type { TranscriptSegment } from "../call-replay.types";

function resetReplayStore() {
  const empty: CallReplayStore = { recordings: {} };
  saveStore(empty);
}

describe("call replay storage & parsing", () => {
  beforeEach(() => {
    resetReplayStore();
    loadStore();
  });

  it("parses labeled transcript lines", () => {
    const raw = `Rep: Hi, thanks for taking the call.
Prospect: Not interested right now.
Rep: Fair — two minutes tomorrow or a one-pager tonight?`;
    const segs = parseTranscriptPaste(raw);
    expect(segs.length).toBeGreaterThanOrEqual(3);
    expect(segs.some((s) => s.speaker === "rep")).toBe(true);
    expect(segs.some((s) => s.speaker === "prospect")).toBe(true);
  });

  it("creates and lists recordings", () => {
    const t = parseTranscriptPaste("Rep: Hello.\nProspect: Hi.");
    const rec = createRecording({
      title: "Test call",
      transcript: t,
      metadata: { consentAcknowledged: true },
    });
    expect(rec.recordingId).toBeTruthy();
    const list = listRecordings();
    expect(list.some((r) => r.recordingId === rec.recordingId)).toBe(true);
    deleteRecording(rec.recordingId);
    expect(listRecordings().some((r) => r.recordingId === rec.recordingId)).toBe(false);
  });
});

describe("analyzeCallReplay", () => {
  it("flags objection and produces score", () => {
    const transcript: TranscriptSegment[] = [
      { id: "a", speaker: "rep", text: "Quick question on routing.", startSec: 0, endSec: 5 },
      {
        id: "b",
        speaker: "prospect",
        text: "Too expensive for us this quarter.",
        startSec: 6,
        endSec: 12,
      },
      {
        id: "c",
        speaker: "rep",
        text: "Maybe we can think about it and possibly reconnect whenever works.",
        startSec: 13,
        endSec: 22,
      },
    ];
    const r = analyzeCallReplay(transcript);
    expect(r.overallScore).toBeGreaterThanOrEqual(28);
    expect(r.overallScore).toBeLessThanOrEqual(96);
    expect(r.events.some((e) => e.kind === "objection")).toBe(true);
    expect(r.events.some((e) => e.kind === "weak_close")).toBe(true);
    expect(r.betterResponses.length).toBeGreaterThan(0);
  });
});

describe("rewriteMoment", () => {
  it("returns coaching line for rep segment", () => {
    const transcript: TranscriptSegment[] = [
      { id: "r1", speaker: "rep", text: "Hope we can maybe figure something out later.", startSec: 0, endSec: 8 },
    ];
    const out = rewriteMoment("r1", transcript, "close");
    expect(out?.improved.length).toBeGreaterThan(10);
    expect(out?.rationale).toBeTruthy();
  });
});
