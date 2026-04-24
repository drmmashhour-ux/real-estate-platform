import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { UserIntelligenceServiceResult, UserJourneyUpdateInput } from "../types/user-intelligence.types";
import { journeyIntentWeight, recency01 } from "../utils/user-journey-score";

export type UserJourneyView = {
  id: string;
  userId: string;
  currentIntent: string | null;
  currentDomain: string | null;
  currentStage: string | null;
  currentSearchMode: string | null;
  latestCity: string | null;
  latestBudgetBand: string | null;
  latestPropertyIntent: string | null;
  latestHouseholdBand: string | null;
  summaryJson: Record<string, unknown> | null;
  lastActivityAt: string | null;
  recency: number;
  intentWeight: number;
};

export async function getJourneyState(
  userId: string,
): Promise<UserIntelligenceServiceResult<UserJourneyView | null>> {
  try {
    const j = await prisma.userJourneyState.findUnique({ where: { userId } });
    if (!j) {
      return { ok: true, data: null };
    }
    const r = recency01(j.lastActivityAt);
    const w = journeyIntentWeight({
      domain: j.currentDomain,
      stage: j.currentStage,
      lastActivity: j.lastActivityAt,
    });
    return {
      ok: true,
      data: {
        id: j.id,
        userId: j.userId,
        currentIntent: j.currentIntent,
        currentDomain: j.currentDomain,
        currentStage: j.currentStage,
        currentSearchMode: j.currentSearchMode,
        latestCity: j.latestCity,
        latestBudgetBand: j.latestBudgetBand,
        latestPropertyIntent: j.latestPropertyIntent,
        latestHouseholdBand: j.latestHouseholdBand,
        summaryJson: (j.summaryJson as Record<string, unknown> | null) ?? null,
        lastActivityAt: j.lastActivityAt?.toISOString() ?? null,
        recency: r,
        intentWeight: w,
      },
    };
  } catch (e) {
    playbookLog.warn("user_intelligence: getJourneyState", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "get_journey_failed" };
  }
}

export async function updateJourneyState(
  input: UserJourneyUpdateInput,
): Promise<UserIntelligenceServiceResult<UserJourneyView | null>> {
  try {
    if (!input.userId) {
      return { ok: false, error: "missing_user" };
    }
    const j = await prisma.userJourneyState.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        currentIntent: input.currentIntent,
        currentDomain: input.currentDomain,
        currentStage: input.currentStage,
        currentSearchMode: input.currentSearchMode,
        latestCity: input.latestCity,
        latestBudgetBand: input.latestBudgetBand,
        latestPropertyIntent: input.latestPropertyIntent,
        latestHouseholdBand: input.latestHouseholdBand,
        summaryJson: input.summaryJson as object,
        lastActivityAt: input.touchActivityAt === false ? null : new Date(),
      },
      update: {
        ...(input.currentIntent !== undefined && { currentIntent: input.currentIntent }),
        ...(input.currentDomain !== undefined && { currentDomain: input.currentDomain }),
        ...(input.currentStage !== undefined && { currentStage: input.currentStage }),
        ...(input.currentSearchMode !== undefined && { currentSearchMode: input.currentSearchMode }),
        ...(input.latestCity !== undefined && { latestCity: input.latestCity }),
        ...(input.latestBudgetBand !== undefined && { latestBudgetBand: input.latestBudgetBand }),
        ...(input.latestPropertyIntent !== undefined && { latestPropertyIntent: input.latestPropertyIntent }),
        ...(input.latestHouseholdBand !== undefined && { latestHouseholdBand: input.latestHouseholdBand }),
        ...(input.summaryJson !== undefined && { summaryJson: input.summaryJson as object }),
        ...(input.touchActivityAt !== false && { lastActivityAt: new Date() }),
      },
    });
    const g = await getJourneyState(input.userId);
    if (g.ok && g.data) {
      return { ok: true, data: g.data };
    }
    return { ok: true, data: null };
  } catch (e) {
    playbookLog.warn("user_intelligence: updateJourney", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "update_journey_failed" };
  }
}
