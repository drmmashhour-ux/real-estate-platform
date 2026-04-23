import type { SalesProfile, StrategySuggestion } from "./ai-sales-manager.types";
import { uid } from "./ai-sales-manager-storage";

/**
 * Tactical strategies — titles + explanations + exemplar lines (human-delivered).
 */
export function generateStrategySuggestions(profile: SalesProfile): StrategySuggestion[] {
  const demoRate = profile.totalCalls > 0 ? profile.demosBooked / profile.totalCalls : 0;
  const out: StrategySuggestion[] = [];

  if (demoRate < 0.18 && profile.totalCalls >= 4) {
    out.push({
      id: uid(),
      title: "Shorten openings — earn the next sentence",
      explanation:
        `Demo rate ~${Math.round(demoRate * 100)}% across ${profile.totalCalls} logged calls suggests prospects disengage early.`,
      whenToUse: "First 30–45s of outbound or inbound discovery where timeboxed buyers dominate.",
      exampleLine:
        "Two sentences on what changes on your desk this week — then I’ll ask one filter question so we don’t waste your time.",
      triggers: [
        { label: "demoRate", value: demoRate.toFixed(3) },
        { label: "totalCalls", value: profile.totalCalls },
      ],
    });
  }

  if ((profile.averageControlScore ?? 70) < 65 && profile.totalCalls >= 3) {
    out.push({
      id: uid(),
      title: "Ask more control questions before mechanisms",
      explanation:
        `Average control score ~${Math.round(profile.averageControlScore)} implies frame shifts after objections.`,
      whenToUse: "Immediately after any buyer objection or skepticism cue.",
      exampleLine:
        "Fair — before I explain how, what would ‘good’ look like on your calendar this week so we know this is worth five minutes?",
      triggers: [{ label: "averageControlScore", value: Math.round(profile.averageControlScore) }],
    });
  }

  if (profile.mostCommonObjections[0]) {
    const o = profile.mostCommonObjections[0];
    out.push({
      id: uid(),
      title: "Pre-brief the recurring objection",
      explanation: `Most frequent objection signal in logs: "${o.slice(0, 120)}". Prepare alignment + proof + micro-ask.`,
      whenToUse: "Pre-call brief (assistant layer) before dialing or joining live bridge.",
      exampleLine:
        "If they raise bandwidth, lead with empathy, offer one observable proof point, then binary time choice.",
      triggers: [{ label: "topObjection", value: o }],
    });
  }

  if ((profile.averageClosingScore ?? 70) < 62) {
    out.push({
      id: uid(),
      title: "Binary close earlier with time anchors",
      explanation:
        `Closing lab scores (~${Math.round(profile.averageClosingScore)}) lag control — reduce hedged asks.`,
      whenToUse: "Once pain + fit are acknowledged; avoid feature dumps after buying signs.",
      exampleLine: "Does today 4pm or tomorrow 9am work for a 12-minute walkthrough with your CRM admin?",
      triggers: [{ label: "averageClosingScore", value: Math.round(profile.averageClosingScore) }],
    });
  }

  if ((profile.personalityAvgScore.ANALYTICAL ?? 80) < 68 && (profile.personalitySessionCount.ANALYTICAL ?? 0) >= 2) {
    out.push({
      id: uid(),
      title: "Stop explaining features before qualitative fit",
      explanation:
        "Analytical personas stall when fed features early — qualify intent and metric first.",
      whenToUse: "When buyer asks 'how it works' before agreeing on problem definition.",
      exampleLine:
        "Happy to diagram it — quick filter: what metric moves if this works in week one for your desk?",
      triggers: [{ label: "analyticalAvg", value: Math.round(profile.personalityAvgScore.ANALYTICAL ?? 0) }],
    });
  }

  if (out.length === 0) {
    out.push({
      id: uid(),
      title: "Keep concise proof → question rhythm",
      explanation:
        "Profile balanced — preserve momentum with disciplined proof hooks and calendar asks each practice.",
      whenToUse: "Every live or lab call as default operating cadence.",
      exampleLine:
        "One proof, one question: what would convince you this is worth a calendar hold this week?",
      triggers: [{ label: "averageTrainingScore", value: Math.round(profile.averageTrainingScore) }],
    });
  }

  return out.slice(0, 6);
}

export function listPreCallWatchouts(profile: SalesProfile): string[] {
  const lines: string[] = [];
  if (profile.mostCommonObjections[0]) {
    lines.push(`Likely objection: ${profile.mostCommonObjections[0].slice(0, 140)}`);
  }
  if (profile.weakestPersonalityMatch) {
    lines.push(`Prep extra patience for ${profile.weakestPersonalityMatch.toLowerCase()} cues.`);
  }
  if ((profile.averageControlScore ?? 80) < 62) {
    lines.push("Watch for frame loss after first objection — use empathy + micro-ask.");
  }
  return lines.slice(0, 5);
}
