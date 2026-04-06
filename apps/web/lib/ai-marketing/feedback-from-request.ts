import type { ContentTheme, GenerationFeedbackInput } from "./types";
import { getGenerationAnalyticsHints } from "@/lib/marketing-analytics/prompt-hints";

export function feedbackFromBody(body: {
  pastPerformance?: string;
  bestThemes?: ContentTheme[];
  channelNotes?: string;
  priorHighPerformingExamples?: string;
}): GenerationFeedbackInput | undefined {
  const past = body.pastPerformance?.trim();
  const themes = body.bestThemes?.filter(Boolean);
  const ch = body.channelNotes?.trim();
  const ex = body.priorHighPerformingExamples?.trim();
  if (!past && !themes?.length && !ch && !ex) return undefined;
  return {
    ...(past ? { pastPerformance: past } : {}),
    ...(themes?.length ? { bestThemes: themes } : {}),
    ...(ch ? { channelNotes: ch } : {}),
    ...(ex ? { priorHighPerformingExamples: ex } : {}),
  };
}

export function mergeGenerationFeedback(
  manual?: GenerationFeedbackInput,
  auto?: GenerationFeedbackInput
): GenerationFeedbackInput | undefined {
  if (!manual && !auto) return undefined;
  const themeSet = new Set<ContentTheme>([...(manual?.bestThemes ?? []), ...(auto?.bestThemes ?? [])]);
  const bestThemes = [...themeSet].slice(0, 10);
  const pastPerformance = [manual?.pastPerformance, auto?.pastPerformance].filter(Boolean).join("\n\n") || undefined;
  const channelNotes = [manual?.channelNotes, auto?.channelNotes].filter(Boolean).join("\n") || undefined;
  const priorHighPerformingExamples =
    [manual?.priorHighPerformingExamples, auto?.priorHighPerformingExamples].filter(Boolean).join("\n\n---\n\n") ||
    undefined;
  return {
    ...(pastPerformance ? { pastPerformance } : {}),
    ...(bestThemes.length ? { bestThemes } : {}),
    ...(channelNotes ? { channelNotes } : {}),
    ...(priorHighPerformingExamples ? { priorHighPerformingExamples } : {}),
  };
}

/**
 * Merges request feedback with internal analytics-derived hints (DB, no external APIs).
 */
export async function feedbackFromBodyWithAnalytics(body: {
  pastPerformance?: string;
  bestThemes?: ContentTheme[];
  channelNotes?: string;
  priorHighPerformingExamples?: string;
  skipAnalyticsHints?: boolean;
}): Promise<GenerationFeedbackInput | undefined> {
  const manual = feedbackFromBody(body);
  if (body.skipAnalyticsHints) return manual;
  const auto = await getGenerationAnalyticsHints();
  return mergeGenerationFeedback(manual, auto);
}
