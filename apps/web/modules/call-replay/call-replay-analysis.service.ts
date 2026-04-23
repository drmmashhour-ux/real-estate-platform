import type { CallReplayAnalysisResult, ReplayEvent, TranscriptSegment } from "./call-replay.types";
import { suggestBetterLine } from "./call-replay-rewrite.service";

const OBJECTION = /\b(not interested|busy|no time|send email|already have|too expensive|stop calling)\b/i;
const HESITATE = /\b(um+|uh+|like,|i mean|maybe|i guess|sort of)\b/i;
const STRONG = /\b(book|calendar|invite|demo|if it helps|fair question|two things|quick)\b/i;
const WEAK_CLOSE = /\b(maybe we can|hope to|think about|possibly|whenever)\b/i;
const LONG_WORDS = 52;

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function scoreRepLine(text: string): number {
  let s = 72;
  if (words(text) > LONG_WORDS) s -= 14;
  if (!/\?/.test(text) && words(text) > 25) s -= 8;
  if (WEAK_CLOSE.test(text)) s -= 12;
  if (STRONG.test(text)) s += 10;
  if (/\?/.test(text)) s += 8;
  return Math.min(96, Math.max(28, s));
}

/**
 * Deterministic coaching analysis — transparent rules (not black-box ML).
 */
export function analyzeCallReplay(transcript: TranscriptSegment[]): CallReplayAnalysisResult {
  const events: ReplayEvent[] = [];
  const mistakes: string[] = [];
  const strengths: string[] = [];
  const missedOpportunities: string[] = [];
  const betterResponses: { segmentId: string; suggestion: string }[] = [];

  let scoreSum = 0;
  let repLines = 0;

  const repJoined = transcript.filter((x) => x.speaker === "rep").map((x) => x.text).join(" ");

  for (const seg of transcript) {
    if (seg.speaker !== "rep") continue;
    repLines += 1;
    const sc = scoreRepLine(seg.text);
    scoreSum += sc;

    if (words(seg.text) > LONG_WORDS) {
      events.push({
        kind: "long_explanation",
        segmentId: seg.id,
        startSec: seg.startSec,
        message: "Long monologue — tighten to proof + question.",
      });
      mistakes.push("Long explanation — trim before the ask.");
      betterResponses.push({ segmentId: seg.id, suggestion: suggestBetterLine(seg, transcript) });
    }
    if (WEAK_CLOSE.test(seg.text) && !STRONG.test(seg.text)) {
      events.push({
        kind: "weak_close",
        segmentId: seg.id,
        startSec: seg.startSec,
        message: "Hedged close — use a time-bound ask.",
      });
      mistakes.push("Weak close / hedging detected.");
      if (!betterResponses.some((b) => b.segmentId === seg.id)) {
        betterResponses.push({ segmentId: seg.id, suggestion: suggestBetterLine(seg, transcript) });
      }
    }
    if (STRONG.test(seg.text) && /\?/.test(seg.text)) {
      events.push({
        kind: "strong_response",
        segmentId: seg.id,
        startSec: seg.startSec,
        message: "Strong — question-led control.",
      });
      strengths.push(`Strong question-led line (~${Math.floor(seg.startSec)}s)`);
    }
    if (HESITATE.test(seg.text)) {
      events.push({
        kind: "hesitation",
        segmentId: seg.id,
        startSec: seg.startSec,
        message: "Filler / hesitation — pause, then one clear sentence.",
      });
    }
  }

  for (const seg of transcript) {
    if (seg.speaker === "prospect" && OBJECTION.test(seg.text)) {
      events.push({
        kind: "objection",
        segmentId: seg.id,
        startSec: seg.startSec,
        message: "Objection moment — align, then micro-ask.",
      });
    }
  }

  for (let i = 0; i < transcript.length - 1; i++) {
    const a = transcript[i]!;
    const b = transcript[i + 1]!;
    if (a.speaker === "prospect" && OBJECTION.test(a.text) && b.speaker === "rep") {
      if (!/\b(understood|fair|thanks|makes sense|hear you|appreciate)\b/i.test(b.text)) {
        events.push({
          kind: "control_loss",
          segmentId: b.id,
          startSec: b.startSec,
          message: "Missed empathy cue after objection.",
        });
        missedOpportunities.push("Lead with alignment after objections.");
        if (!betterResponses.some((x) => x.segmentId === b.id)) {
          betterResponses.push({ segmentId: b.id, suggestion: suggestBetterLine(b, transcript) });
        }
      }
    }
  }

  if (!/\b(book|calendar|invite|schedule|demo)\b/i.test(repJoined)) {
    missedOpportunities.push("No explicit calendar/demo ask in rep lines.");
  }

  const overallScore = repLines > 0 ? Math.round(scoreSum / repLines) : transcript.length ? 55 : 40;

  const dedupe = (arr: string[]) => [...new Set(arr)].slice(0, 10);

  if (strengths.length === 0 && repLines > 0) {
    strengths.push("Call captured for review — keep practicing question-led pacing.");
  }

  return {
    overallScore: Math.min(96, Math.max(35, overallScore)),
    strengths: dedupe(strengths).slice(0, 8),
    mistakes: dedupe(mistakes),
    missedOpportunities: dedupe(missedOpportunities),
    betterResponses: betterResponses.slice(0, 12),
    events: events.slice(0, 40),
  };
}
