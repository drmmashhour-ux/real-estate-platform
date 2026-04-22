import { prisma } from "@/lib/db";

import type {
  SoinsAdminPulseVm,
  SoinsResidentDailyVm,
  SoinsRiskLevel,
} from "./soins-ai.types";
import { evaluateSoinsRisk } from "./soins-ai-risk.service";

const HOURS_WINDOW = 24;

function subHours(date: Date, h: number): Date {
  return new Date(date.getTime() - h * 60 * 60 * 1000);
}

export type LoadedResidentSnapshot = {
  events: Array<{ type: string; severity: string; message: string; createdAt: Date }>;
  chatMessagesRecent: Array<{ message: string; createdAt: Date }>;
  cameraStreams: Array<{ isActive: boolean }>;
};

export async function loadResidentMonitoringSnapshot(
  residentId: string,
  since: Date,
): Promise<LoadedResidentSnapshot> {
  const [events, chats, streams] = await Promise.all([
    prisma.careEvent.findMany({
      where: { residentId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { type: true, severity: true, message: true, createdAt: true },
    }),
    prisma.careChatMessage.findMany({
      where: { residentId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { message: true, createdAt: true },
    }),
    prisma.cameraStream.findMany({
      where: { residentId },
      select: { isActive: true },
    }),
  ]);

  return { events, chatMessagesRecent: chats, cameraStreams: streams };
}

/** Meals / medication wording is operational workflow only — never diagnostic. */
export function deriveMealsOperationalStatus(events: LoadedResidentSnapshot["events"]): string {
  const mealHints = events.filter((e) => /\bmeal|repas|nutrition\b/i.test(e.message));
  const missedMeal = mealHints.some((e) => /\bmiss|skipped|late|absent\b/i.test(e.message));
  if (missedMeal) return "Operational meal workflow signals require follow-up.";
  if (mealHints.length > 0) return "Meal-related operational notes were recorded.";
  return "No meal-workflow alerts in this window.";
}

export function deriveActivityOperationalStatus(events: LoadedResidentSnapshot["events"]): string {
  const movement = events.filter((e) => e.type === "MOVEMENT");
  if (movement.length === 0) return "No movement-category operational signals in this window.";
  return `${movement.length} movement-related operational signal(s) recorded — review timeline as needed.`;
}

export function deriveCameraOperationalStatus(streams: LoadedResidentSnapshot["cameraStreams"]): string {
  if (streams.length === 0) return "No camera streams configured — operational visibility depends on residence setup.";
  const active = streams.filter((s) => s.isActive).length;
  return `${active} active stream channel(s) of ${streams.length} configured.`;
}

export function buildCommunicationHighlight(chats: LoadedResidentSnapshot["chatMessagesRecent"]): string {
  const last = chats[0];
  if (!last) return "No recent chat activity in this window.";
  const snippet = last.message.trim().slice(0, 120);
  return `Latest message (${last.createdAt.toISOString().slice(0, 16)}): ${snippet}${last.message.length > 120 ? "…" : ""}`;
}

/** Deterministic resident daily card — suitable for dashboards & mobile caching. */
export function materializeResidentDailySummary(input: {
  residentId: string;
  snapshot: LoadedResidentSnapshot;
  generatedAt?: Date;
}): SoinsResidentDailyVm {
  const now = input.generatedAt ?? new Date();
  const ev = input.snapshot.events;

  const mealsOperationalStatus = deriveMealsOperationalStatus(ev);
  const activityOperationalStatus = deriveActivityOperationalStatus(ev);
  const cameraOperationalStatus = deriveCameraOperationalStatus(input.snapshot.cameraStreams);
  const communicationHighlight = buildCommunicationHighlight(input.snapshot.chatMessagesRecent);

  const snapshotCounts = deriveSignalCountsFromEvents(ev);
  const camInactive =
    input.snapshot.cameraStreams.length > 0 &&
    input.snapshot.cameraStreams.every((s) => !s.isActive);

  const fc = snapshotCounts.FAMILY_CONCERN ?? 0;
  const familyConcernLevel =
    fc >= 2 ? "elevated" : fc >= 1 ? "standard" : "none";

  const assessed = evaluateSoinsRisk({
    residentId: input.residentId,
    signalCounts: snapshotCounts,
    cameraInactive: camInactive,
    familyConcernLevel,
  });

  const nextFollowUpRecommendation =
    assessed.recommendedActions[0] ??
    "Maintain routine operational monitoring — no escalation triggers in this snapshot.";

  return {
    residentId: input.residentId,
    generatedAtIso: now.toISOString(),
    mealsOperationalStatus,
    activityOperationalStatus,
    alertsLast24h: ev.length,
    communicationHighlight,
    cameraOperationalStatus,
    nextFollowUpRecommendation,
  };
}

/** Map persisted care events → monitoring signal buckets (operational tagging). */
export function deriveSignalCountsFromEvents(
  events: LoadedResidentSnapshot["events"],
): Partial<Record<import("./soins-ai.types").SoinsSignalType, number>> {
  const counts: Partial<Record<string, number>> = {};
  const bump = (k: import("./soins-ai.types").SoinsSignalType) => {
    counts[k] = (counts[k] ?? 0) + 1;
  };

  for (const e of events) {
    const msg = e.message.toLowerCase();

    if (e.type === "EMERGENCY") bump("EMERGENCY_BUTTON");

    if (e.type === "MOVEMENT" || /\bmovement|mobility\b/i.test(e.message)) {
      if (/\babnormal|unexpected|unusual\b/i.test(msg)) bump("ABNORMAL_ACTIVITY");
      else if (/\bmiss|missed|late\b/i.test(msg)) bump("MOVEMENT_MISSED");
    }

    if (/\bmeal|nutrition|cafeteria|breakfast|lunch|dinner\b/i.test(msg)) {
      if (/\bmiss|missed|skipped|late\b/i.test(msg)) bump("MISSED_MEAL");
    }

    if (/\bmedication|medicament|pill|dose\b/i.test(msg)) {
      if (/\bmiss|missed|skipped|late\b/i.test(msg)) bump("MISSED_MEDICATION");
    }

    if (/\bcamera|stream|video\b/i.test(msg)) {
      if (/\binactive|offline|unavailable\b/i.test(msg)) bump("CAMERA_INACTIVITY");
    }

    if (/\bdistress|worried|help\b/i.test(msg) && e.type === "ALERT") bump("CHAT_DISTRESS_SIGNAL");

    if (/\bfamily\b.*\bconcern|concern\b.*\bfamily\b/i.test(msg)) bump("FAMILY_CONCERN");
  }

  return counts as Partial<Record<import("./soins-ai.types").SoinsSignalType, number>>;
}

export async function buildResidentDailySummary(residentId: string): Promise<SoinsResidentDailyVm> {
  const since = subHours(new Date(), HOURS_WINDOW);
  const snapshot = await loadResidentMonitoringSnapshot(residentId, since);
  return materializeResidentDailySummary({ residentId, snapshot });
}

/** Shorter wording for non-clinical family readers. */
export async function buildFamilyFriendlySummary(residentId: string): Promise<{
  greetingLine: string;
  todayInPlainWords: string;
  daily: SoinsResidentDailyVm;
}> {
  const daily = await buildResidentDailySummary(residentId);
  const resident = await prisma.residentProfile.findUnique({
    where: { id: residentId },
    select: {
      user: { select: { name: true } },
      residence: { select: { title: true } },
    },
  }).catch(() => null);

  const rawName = resident?.user?.name?.trim();
  const name =
    rawName?.split(/\s+/)[0] ?? "your loved one";

  const greetingLine = `Here's a simple operational snapshot for ${name}.`;
  const todayInPlainWords =
    `${daily.mealsOperationalStatus} ${daily.activityOperationalStatus}`.slice(0, 480);

  return { greetingLine, todayInPlainWords, daily };
}

export async function buildAdminSoinsSummary(): Promise<SoinsAdminPulseVm> {
  const since = subHours(new Date(), HOURS_WINDOW);
  const now = new Date();

  const [criticalOpenCount, highOpenCount, residentCount, recentCritical] = await Promise.all([
    prisma.careEvent.count({
      where: { createdAt: { gte: since }, type: "EMERGENCY" },
    }),
    prisma.careEvent.count({
      where: {
        createdAt: { gte: since },
        severity: "HIGH",
        type: { not: "EMERGENCY" },
      },
    }),
    prisma.residentProfile.count(),
    prisma.careEvent.findMany({
      where: { createdAt: { gte: since }, OR: [{ type: "EMERGENCY" }, { severity: "HIGH" }] },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { message: true, type: true, severity: true },
    }),
  ]);

  const recentOperationalNotes = recentCritical.map(
    (e) => `[${e.type}/${e.severity}] ${e.message.slice(0, 140)}${e.message.length > 140 ? "…" : ""}`,
  );

  return {
    generatedAtIso: now.toISOString(),
    residentsMonitored: residentCount,
    criticalOpenCount,
    highOpenCount,
    recentOperationalNotes:
      recentOperationalNotes.length > 0
        ? recentOperationalNotes
        : ["No HIGH/EMERGENCY operational events in the rolling window."],
  };
}

/** Lightweight risk VM for embedded tiles — uses same counts as summaries. */
export async function buildFamilyRiskOverviewVm(input: {
  residentId: string;
}): Promise<{ residentId: string; riskLevel: SoinsRiskLevel; headline: string; summaryLines: string[] }> {
  const since = subHours(new Date(), HOURS_WINDOW);
  const snapshot = await loadResidentMonitoringSnapshot(input.residentId, since);
  const counts = deriveSignalCountsFromEvents(snapshot.events);
  const camInactive =
    snapshot.cameraStreams.length > 0 && snapshot.cameraStreams.every((s) => !s.isActive);

  const assessed = evaluateSoinsRisk({
    residentId: input.residentId,
    signalCounts: counts,
    cameraInactive: camInactive,
    familyConcernLevel:
      (counts.FAMILY_CONCERN ?? 0) >= 2 ? "elevated" : (counts.FAMILY_CONCERN ?? 0) >= 1 ? "standard" : "none",
  });

  const headline =
    assessed.riskLevel === "LOW"
      ? "Operational monitoring: stable window."
      : assessed.riskLevel === "CRITICAL"
        ? "Operational escalation recommended — urgent coordination."
        : "Operational follow-up advised — review recent signals.";

  return {
    residentId: input.residentId,
    riskLevel: assessed.riskLevel,
    headline,
    summaryLines: assessed.reasons.slice(0, 5),
  };
}
