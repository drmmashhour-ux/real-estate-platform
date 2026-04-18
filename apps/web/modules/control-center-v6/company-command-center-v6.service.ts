/**
 * V6 — parallel path over V4 aggregate + optional V1 history read (no legacy mutation).
 */
import { logInfo } from "@/lib/logger";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { loadCompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.service";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import type {
  CommandCenterBoardPack,
  CommandCenterDueDiligenceSummary,
  CommandCenterV6Mode,
  CommandCenterV6Modes,
  CommandCenterWarRoomSummary,
  CompanyCommandCenterV6Meta,
  CompanyCommandCenterV6Payload,
  CompanyCommandCenterV6Shared,
  LoadCompanyCommandCenterV6Params,
} from "./company-command-center-v6.types";
import { mapAuditTrailMode } from "./mode-mappers/audit-trail-mode-mapper";
import { mapDueDiligenceMode } from "./mode-mappers/due-diligence-mode-mapper";
import { mapLaunchWarRoomMode } from "./mode-mappers/launch-war-room-mode-mapper";
import { mapWeeklyBoardPackMode } from "./mode-mappers/weekly-board-pack-mode-mapper";

const NS = "[control-center:v6]";

function parseMode(raw: string | null | undefined): CommandCenterV6Mode | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase().replace(/-/g, "_");
  if (r === "weekly_board_pack" || r === "weeklyboardpack") return "weekly_board_pack";
  if (r === "due_diligence" || r === "duediligence") return "due_diligence";
  if (r === "launch_war_room" || r === "launchwarroom") return "launch_war_room";
  if (r === "audit_trail" || r === "audittrail") return "audit_trail";
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function emptyBoard(): CommandCenterBoardPack {
  return {
    mode: "weekly_board_pack",
    executiveSummary: "—",
    weeklyWins: [],
    weeklyRisks: [],
    rolloutChanges: [],
    systemHealthSummary: {},
    boardMetrics: {},
    notes: [],
  };
}

function emptyDiligence(): CommandCenterDueDiligenceSummary {
  return {
    mode: "due_diligence",
    diligenceSummary: "—",
    moatSignals: [],
    governanceSignals: [],
    maturitySignals: [],
    riskSignals: [],
    openQuestions: [],
    evidenceNotes: [],
  };
}

function emptyWar(): CommandCenterWarRoomSummary {
  return {
    mode: "launch_war_room",
    launchSummary: "—",
    criticalSystems: [],
    blockers: [],
    goNoGoSignals: [],
    escalationItems: [],
    readinessChecklist: {},
    warnings: [],
  };
}

function emptyAudit() {
  return {
    mode: "audit_trail" as const,
    summary: "—",
    entries: [],
    groupedBySystem: [],
    groupedBySeverity: [],
    traceabilityNotes: [],
  };
}

function narrowModes(focus: CommandCenterV6Mode, full: CommandCenterV6Modes): CommandCenterV6Modes {
  return {
    weeklyBoardPack: focus === "weekly_board_pack" ? full.weeklyBoardPack : emptyBoard(),
    dueDiligence: focus === "due_diligence" ? full.dueDiligence : emptyDiligence(),
    launchWarRoom: focus === "launch_war_room" ? full.launchWarRoom : emptyWar(),
    auditTrail: focus === "audit_trail" ? full.auditTrail : emptyAudit(),
  };
}

async function loadV1ForAudit(days: number, limit: number, offsetDays: number): Promise<AiControlCenterPayload | null> {
  try {
    return await loadAiControlCenterPayload({ days, limit, offsetDays });
  } catch {
    return null;
  }
}

export async function loadCompanyCommandCenterV6Payload(
  params: LoadCompanyCommandCenterV6Params = {},
): Promise<CompanyCommandCenterV6Payload> {
  const started = Date.now();
  const days = clamp(params.days ?? 7, 1, 90);
  const limit = clamp(params.limit ?? 10, 1, 50);
  const offsetDays = Math.max(0, params.offsetDays ?? 0);
  const previousOffsetDays = Math.max(1, params.previousOffsetDays ?? 1);
  const modeFilter = parseMode(params.mode ?? undefined);

  try {
    const v4 = await loadCompanyCommandCenterV4Payload({
      days,
      limit,
      offsetDays,
      previousOffsetDays,
      role: params.role,
      presetId: params.presetId,
    });

    const v1 = await loadV1ForAudit(days, limit, offsetDays);

    const shared: CompanyCommandCenterV6Shared = {
      overallStatus: v4.v3.shared.overallStatus,
      systems: v4.v3.shared.systems,
      rolloutSummary: v4.v3.shared.rolloutSummary,
      quickKpis: v4.v3.shared.quickKpis,
      meta: {
        systemsLoadedCount: v4.v3.shared.meta.systemsLoadedCount,
        overallStatus: v4.v3.shared.meta.overallStatus,
        partialData: v4.v3.shared.meta.partialData,
      },
    };

    const fullModes: CommandCenterV6Modes = {
      weeklyBoardPack: mapWeeklyBoardPackMode(v4, v1),
      dueDiligence: mapDueDiligenceMode(v4, v1),
      launchWarRoom: mapLaunchWarRoomMode(v4, v1),
      auditTrail: mapAuditTrailMode(v4, v1),
    };

    const modes = modeFilter ? narrowModes(modeFilter, fullModes) : fullModes;

    const auditEntryCount = fullModes.auditTrail.entries.length;
    const highlightsGenerated =
      fullModes.weeklyBoardPack.notes.length +
      fullModes.dueDiligence.evidenceNotes.length +
      fullModes.launchWarRoom.escalationItems.length +
      auditEntryCount;

    const meta: CompanyCommandCenterV6Meta = {
      currentWindow: { ...v4.meta.currentWindow },
      previousWindow: { ...v4.meta.previousWindow },
      dataFreshnessMs: Date.now() - started,
      sourcesUsed: [...v4.meta.sourcesUsed, "control_center_v6:mode_map", ...(v1 ? ["ai_control_center_v1:history"] : [])],
      missingSources: v4.meta.missingSources,
      highlightsGenerated,
      auditEntryCount,
      focusedMode: modeFilter,
      v1HistoryAvailable: v1 != null && v1.history.length > 0,
    };

    const payload: CompanyCommandCenterV6Payload = { shared, modes, meta };

    logInfo(NS, {
      event: "payload_ready",
      modeFilter: modeFilter ?? null,
      systemsLoaded: shared.meta.systemsLoadedCount,
      missingSourcesCount: meta.missingSources.length,
      overallStatus: shared.overallStatus,
      highlightsGenerated: meta.highlightsGenerated,
      auditEntries: meta.auditEntryCount,
      v1HistoryRows: v1?.history.length ?? 0,
    });

    return payload;
  } catch (e) {
    logInfo(NS, {
      event: "payload_failed",
      message: e instanceof Error ? e.message : String(e),
    });
    return buildEmptyV6Payload(Date.now() - started, e);
  }
}

function buildEmptyV6Payload(dataFreshnessMs: number, err: unknown): CompanyCommandCenterV6Payload {
  const msg = emsg(err);
  return {
    shared: {
      overallStatus: "limited",
      systems: null,
      rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
      quickKpis: [],
      meta: { systemsLoadedCount: 0, overallStatus: "limited", partialData: true },
    },
    modes: {
      weeklyBoardPack: { ...emptyBoard(), executiveSummary: msg, notes: [msg] },
      dueDiligence: { ...emptyDiligence(), diligenceSummary: msg },
      launchWarRoom: { ...emptyWar(), launchSummary: msg, warnings: [msg] },
      auditTrail: { ...emptyAudit(), summary: msg },
    },
    meta: {
      currentWindow: { label: "n/a", days: 7, offsetDays: 0 },
      previousWindow: { label: "n/a", days: 7, offsetDays: 1 },
      dataFreshnessMs,
      sourcesUsed: ["control_center_v6:error"],
      missingSources: ["v4_aggregate"],
      highlightsGenerated: 0,
      auditEntryCount: 0,
      focusedMode: null,
      v1HistoryAvailable: false,
    },
  };
}

function emsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
