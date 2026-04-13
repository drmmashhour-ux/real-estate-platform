import { prisma } from "@/lib/db";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { autopilotToAutonomyMode, type AutonomyMode } from "@/lib/system-brain/autonomy-modes";
import { loadDominationMetrics } from "@/lib/growth/domination-metrics";

export type AutonomousSystemBriefing = {
  generatedAt: string;
  autonomy: {
    displayMode: AutonomyMode;
    globalMode: string;
    automationsEnabled: boolean;
    globalKillSwitch: boolean;
    autonomyPausedUntil: string | null;
  };
  metrics: Awaited<ReturnType<typeof loadDominationMetrics>> | null;
  eventBus: {
    pendingDispatch: number;
    recentEvents: Array<{
      id: string;
      eventType: string;
      entityType: string | null;
      entityId: string | null;
      createdAt: Date;
      processedAt: Date | null;
    }>;
    activeRules: Array<{
      name: string;
      eventType: string;
      actionKind: string;
      priority: number;
    }>;
  };
  recommendations: string[];
};

export async function loadAutonomousSystemBriefing(): Promise<AutonomousSystemBriefing> {
  const [settings, metrics, pendingEvents, recentEvents, automationRules] = await Promise.all([
    getManagerAiPlatformSettings(),
    loadDominationMetrics().catch(() => null),
    prisma.platformAutonomyEvent.count({ where: { processedAt: null } }),
    prisma.platformAutonomyEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        eventType: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        processedAt: true,
      },
    }),
    prisma.platformAutomationRule.findMany({
      where: { enabled: true },
      select: { name: true, eventType: true, actionKind: true, priority: true },
      orderBy: { priority: "desc" },
      take: 40,
    }),
  ]);

  const autonomyMode = autopilotToAutonomyMode(settings.globalMode);

  const recommendations: string[] = [];
  if (pendingEvents > 50) {
    recommendations.push(
      "Event backlog is high — ensure POST /api/cron/platform-autonomy runs on your scheduler (CRON_SECRET).",
    );
  } else {
    recommendations.push("Event bus backlog looks healthy.");
  }
  if (settings.globalKillSwitch) {
    recommendations.push("Global kill switch is ON — automations and gated actions are suppressed.");
  }
  if (!settings.automationsEnabled) {
    recommendations.push("Automations are disabled in Manager AI settings — enable to run scheduled batch rules.");
  }
  if (metrics && metrics.bookings.paid7d === 0 && metrics.stays.publishedTotal > 3) {
    recommendations.push(
      "No paid stays in the last 7 days while inventory exists — review conversion, pricing, and checkout friction.",
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    autonomy: {
      displayMode: autonomyMode,
      globalMode: settings.globalMode,
      automationsEnabled: settings.automationsEnabled,
      globalKillSwitch: settings.globalKillSwitch,
      autonomyPausedUntil: settings.autonomyPausedUntil?.toISOString() ?? null,
    },
    metrics,
    eventBus: {
      pendingDispatch: pendingEvents,
      recentEvents,
      activeRules: automationRules,
    },
    recommendations,
  };
}
