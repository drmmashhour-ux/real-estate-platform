import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { countFeedbackWords } from "@/modules/analytics/services/feedback-word-count";

const DAYS = 30;

const EVENT_LABEL: Record<UserEventType, string> = {
  ...Object.fromEntries(Object.values(UserEventType).map((t) => [t, String(t).replace(/_/g, " ")])),
  [UserEventType.ANALYZE]: "Analyze",
  [UserEventType.SAVE_DEAL]: "Save deal",
  [UserEventType.COMPARE]: "Compare",
  [UserEventType.VISIT_PAGE]: "Page visit",
  [UserEventType.WAITLIST_SIGNUP]: "Waitlist signup",
  [UserEventType.RETURN_VISIT]: "Return visit",
} as Record<UserEventType, string>;

export type GrowthMetrics = {
  emailsCollectedTotal: number;
  emailsCollectedPeriod: number;
  /** Analyze → save conversion % (same window) */
  analyzeToSavePercent: number | null;
  /** Sessions with 2+ page-view events (repeat engagement) */
  repeatVisitSessions: number;
  returnVisitEvents: number;
  waitlistEvents: number;
};

export type ProductInsightsPayload = {
  days: number;
  approxUsers: number;
  counts: Record<string, number>;
  growth: GrowthMetrics;
  /** Product-only (excludes VISIT_PAGE) */
  mostUsedFeature: string | null;
  feedback: Array<{
    id: string;
    message: string | null;
    rating: number | null;
    createdAt: string;
  }>;
  wordHighlights: { word: string; count: number }[];
  insights: string[];
};

export async function getProductInsightsPayload(): Promise<ProductInsightsPayload> {
  const since = new Date(Date.now() - DAYS * 86_400_000);

  const [
    grouped,
    sessionGroups,
    feedbackRows,
    emailsCollectedTotal,
    emailsCollectedPeriod,
    pageViewsBySession,
  ] = await Promise.all([
    prisma.userEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.userEvent.groupBy({
      by: ["sessionId"],
      where: {
        createdAt: { gte: since },
        sessionId: { not: null },
      },
      _count: true,
    }),
    prisma.userFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, message: true, rating: true, createdAt: true },
    }),
    prisma.waitlistUser.count(),
    prisma.waitlistUser.count({ where: { createdAt: { gte: since } } }),
    prisma.userEvent.groupBy({
      by: ["sessionId"],
      where: {
        createdAt: { gte: since },
        eventType: UserEventType.VISIT_PAGE,
        sessionId: { not: null },
      },
      _count: true,
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const t of Object.values(UserEventType)) {
    counts[t] = 0;
  }
  for (const g of grouped) {
    counts[g.eventType] = g._count;
  }

  const analyze = counts.ANALYZE;
  const save = counts.SAVE_DEAL;
  const compare = counts.COMPARE;

  const insights: string[] = [];
  if (analyze >= 5 && save / Math.max(analyze, 1) < 0.25) {
    insights.push("Users analyze but don’t save → improve save flow");
  }
  if (analyze >= 5 && compare < 3) {
    insights.push("Comparison feature underused");
  }

  const productTypes = [UserEventType.ANALYZE, UserEventType.SAVE_DEAL, UserEventType.COMPARE] as const;
  let mostUsedFeature: string | null = null;
  let max = 0;
  for (const t of productTypes) {
    const c = counts[t];
    if (c > max) {
      max = c;
      mostUsedFeature = EVENT_LABEL[t];
    }
  }
  if (max === 0) mostUsedFeature = null;

  const wordHighlights = countFeedbackWords(
    feedbackRows.map((f) => f.message).filter((m): m is string => typeof m === "string" && m.trim().length > 0)
  );

  const repeatVisitSessions = pageViewsBySession.filter((g) => g._count >= 2).length;
  const analyzeToSavePercent =
    analyze > 0 ? Math.round((save / analyze) * 1000) / 10 : null;

  const growth: GrowthMetrics = {
    emailsCollectedTotal,
    emailsCollectedPeriod,
    analyzeToSavePercent,
    repeatVisitSessions,
    returnVisitEvents: counts.RETURN_VISIT ?? 0,
    waitlistEvents: counts.WAITLIST_SIGNUP ?? 0,
  };

  return {
    days: DAYS,
    approxUsers: sessionGroups.length,
    counts,
    growth,
    mostUsedFeature,
    feedback: feedbackRows.map((f) => ({
      id: f.id,
      message: f.message,
      rating: f.rating,
      createdAt: f.createdAt.toISOString(),
    })),
    wordHighlights,
    insights,
  };
}
