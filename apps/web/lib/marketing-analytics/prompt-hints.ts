import { prisma } from "@/lib/db";
import type { ContentTheme, GenerationFeedbackInput } from "@/lib/ai-marketing/types";
import { getTopPerformingContent, performanceScore } from "./aggregate-metrics";

const KNOWN_THEMES: ContentTheme[] = [
  "bnhub_listings",
  "travel_inspiration",
  "re_investment",
  "platform_awareness",
  "trust_reviews",
];

function isContentTheme(s: string | null | undefined): s is ContentTheme {
  return Boolean(s && (KNOWN_THEMES as string[]).includes(s));
}

/**
 * Pulls anonymized performance signals from DB for prompt injection (internal only).
 */
export async function getGenerationAnalyticsHints(): Promise<GenerationFeedbackInput | undefined> {
  const pool = await getTopPerformingContent({ take: 60, includeVariants: true });
  if (pool.length === 0) return undefined;

  const byScoreDesc = [...pool].sort((a, b) => performanceScore(b) - performanceScore(a));
  const topSlice = byScoreDesc.slice(0, 6);
  const byScoreAsc = [...pool].sort((a, b) => performanceScore(a) - performanceScore(b));
  const lowSlice = byScoreAsc.slice(0, 4);

  const themeWeights = new Map<string, number>();
  for (const row of topSlice) {
    if (row.theme) {
      themeWeights.set(row.theme, (themeWeights.get(row.theme) ?? 0) + performanceScore(row));
    }
  }
  const bestThemes = [...themeWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .filter(isContentTheme)
    .slice(0, 4);

  const exampleIds = topSlice.slice(0, 2).map((t) => t.contentId);
  const examples: string[] = [];
  for (const id of exampleIds) {
    const row = await prisma.marketingContent.findUnique({
      where: { id },
      select: { content: true },
    });
    if (row?.content) {
      examples.push(row.content.slice(0, 260).trim());
    }
  }

  const lowThemes = lowSlice
    .map((r) => r.theme)
    .filter(Boolean)
    .filter(isContentTheme);
  const lowThemeStr = [...new Set(lowThemes)].join(", ");

  const parts: string[] = [];
  if (lowThemeStr) {
    parts.push(
      `Patterns associated with weaker recent engagement in our data (themes: ${lowThemeStr}) — avoid repeating those angles unless intentional.`
    );
  }

  return {
    ...(bestThemes.length ? { bestThemes } : {}),
    ...(examples.length
      ? {
          priorHighPerformingExamples: examples.join("\n---\n"),
        }
      : {}),
    ...(parts.length ? { pastPerformance: parts.join(" ") } : {}),
  };
}
