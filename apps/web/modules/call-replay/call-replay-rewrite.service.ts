import type { TranscriptSegment } from "./call-replay.types";

/**
 * Coaching rewrite — bounded alternative line (not auto-sent to prospects).
 */
export function suggestBetterLine(segment: TranscriptSegment, fullTranscript: TranscriptSegment[]): string {
  const prevProspect = [...fullTranscript].reverse().find((s) => s.endSec <= segment.startSec && s.speaker === "prospect");

  if (prevProspect && /\b(not interested|busy|email)\b/i.test(prevProspect.text)) {
    return "You’re right — if timing’s tight, two minutes tomorrow or a one-pager tonight: which protects your time?";
  }

  if (segment.text.length > 400 || segment.text.split(/\s+/).length > 55) {
    return "Bottom line in two sentences: one proof, one question — what would ‘good’ look like on your desk this week?";
  }

  if (/\b(maybe|hope|think about)\b/i.test(segment.text)) {
    return "Fair — can we put ten minutes on the calendar today or tomorrow so you can judge live?";
  }

  return "Two things: how you route leads today, and one example of a qualified handoff — want to see that flow?";
}

/** User-selected moment — same helper with optional focus hint */
export function rewriteMoment(
  segmentId: string,
  transcript: TranscriptSegment[],
  hint?: "shorter" | "empathy" | "close",
): { improved: string; rationale: string } | null {
  const seg = transcript.find((s) => s.id === segmentId);
  if (!seg || seg.speaker !== "rep") {
    return {
      improved: suggestBetterLine(transcript[0] ?? seg!, transcript),
      rationale: "Pick a rep line to rewrite.",
    };
  }

  let improved = suggestBetterLine(seg, transcript);
  let rationale = "Default coaching template aligned to flow.";

  if (hint === "shorter") {
    improved =
      "Quick picture: qualified intent → CRM tag — mind if I show that in three minutes?";
    rationale = "Shortened for pace and control.";
  }
  if (hint === "empathy") {
    improved =
      "Makes sense — if that’s noisy, what would proof look like so this feels worth five minutes?";
    rationale = "Lead with alignment before mechanism.";
  }
  if (hint === "close") {
    improved = "Does today 4pm or tomorrow 9am work for a focused walkthrough?";
    rationale = "Binary time-bound close.";
  }

  return { improved, rationale };
}
