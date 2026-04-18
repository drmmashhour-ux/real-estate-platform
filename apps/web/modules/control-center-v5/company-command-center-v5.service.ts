/**
 * V5 — operational modes mapped from full V4 aggregate (read-only).
 */
import { logInfo } from "@/lib/logger";
import { loadCompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.service";
import type {
  CompanyCommandCenterV5Meta,
  CompanyCommandCenterV5Payload,
  CompanyCommandCenterV5Shared,
  CommandCenterMode,
  CommandCenterModePayload,
  IncidentModeView,
  InvestorModeView,
  LaunchModeView,
  LoadCompanyCommandCenterV5Params,
  MorningBriefModeView,
} from "./company-command-center-v5.types";
import { mapIncidentMode } from "./mode-mappers/incident-mode-mapper";
import { mapInvestorMode } from "./mode-mappers/investor-mode-mapper";
import { mapLaunchMode } from "./mode-mappers/launch-mode-mapper";
import { mapMorningBriefMode } from "./mode-mappers/morning-brief-mode-mapper";

const NS = "[control-center:v5]";

function parseMode(raw: string | null | undefined): CommandCenterMode | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase().replace(/-/g, "_");
  if (r === "morning_brief" || r === "morningbrief") return "morning_brief";
  if (r === "incident") return "incident";
  if (r === "launch") return "launch";
  if (r === "investor") return "investor";
  return null;
}

function emptyMorning(): MorningBriefModeView {
  return {
    mode: "morning_brief",
    heroSummary: "Mode data unavailable.",
    topChanges: [],
    topRisks: [],
    topOpportunities: [],
    keySystems: [],
    todayFocus: [],
    warnings: [],
  };
}

function emptyIncident(): IncidentModeView {
  return {
    mode: "incident",
    severity: "low",
    incidentSummary: "—",
    affectedSystems: [],
    criticalWarnings: [],
    rollbackSignals: [],
    stabilityIndicators: {},
    recommendedAttentionAreas: [],
  };
}

function emptyLaunch(): LaunchModeView {
  return {
    mode: "launch",
    launchReadiness: "caution",
    blockers: [],
    readinessChecklist: {},
    rolloutStates: [],
    recommendedGoNoGoNotes: [],
    warnings: [],
  };
}

function emptyInvestor(): InvestorModeView {
  return {
    mode: "investor",
    companySummary: "—",
    growthSignals: [],
    stabilitySignals: [],
    moatSignals: [],
    topMetrics: {},
    strategicRisks: [],
    progressNarrative: [],
  };
}

function narrowModesToFocus(focus: CommandCenterMode, full: CommandCenterModePayload): CommandCenterModePayload {
  const shell = (m: CommandCenterMode): MorningBriefModeView | IncidentModeView | LaunchModeView | InvestorModeView => {
    if (m === "morning_brief") return emptyMorning();
    if (m === "incident") return emptyIncident();
    if (m === "launch") return emptyLaunch();
    return emptyInvestor();
  };
  return {
    morningBrief: focus === "morning_brief" ? full.morningBrief : (shell("morning_brief") as MorningBriefModeView),
    incident: focus === "incident" ? full.incident : (shell("incident") as IncidentModeView),
    launch: focus === "launch" ? full.launch : (shell("launch") as LaunchModeView),
    investor: focus === "investor" ? full.investor : (shell("investor") as InvestorModeView),
  };
}

export async function loadCompanyCommandCenterV5Payload(
  params: LoadCompanyCommandCenterV5Params = {},
): Promise<CompanyCommandCenterV5Payload> {
  const started = Date.now();
  const modeFilter = parseMode(params.mode ?? undefined);

  try {
    const v4 = await loadCompanyCommandCenterV4Payload({
      days: params.days,
      limit: params.limit,
      offsetDays: params.offsetDays,
      previousOffsetDays: params.previousOffsetDays,
      role: params.role,
      presetId: params.presetId,
    });

    const shared: CompanyCommandCenterV5Shared = {
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

    const fullModes: CommandCenterModePayload = {
      morningBrief: mapMorningBriefMode(v4),
      incident: mapIncidentMode(v4),
      launch: mapLaunchMode(v4),
      investor: mapInvestorMode(v4),
    };

    const modes = modeFilter ? narrowModesToFocus(modeFilter, fullModes) : fullModes;

    const highlightsGenerated =
      fullModes.morningBrief.todayFocus.length +
      fullModes.incident.recommendedAttentionAreas.length +
      fullModes.launch.recommendedGoNoGoNotes.length +
      fullModes.investor.progressNarrative.length;

    const meta: CompanyCommandCenterV5Meta = {
      currentWindow: { ...v4.meta.currentWindow },
      previousWindow: { ...v4.meta.previousWindow },
      dataFreshnessMs: Date.now() - started,
      sourcesUsed: [...v4.meta.sourcesUsed, "control_center_v5:mode_map"],
      missingSources: v4.meta.missingSources,
      highlightsGenerated,
      focusedMode: modeFilter,
    };

    const payload: CompanyCommandCenterV5Payload = {
      shared,
      modes,
      meta,
      v4Echo: {
        briefingCardCount: v4.briefing.cards.length,
        digestItemCount: v4.anomalyDigest.items.length,
        deltaChangedCount: v4.changesSinceYesterday.systems.filter((x) => x.changed).length,
      },
    };

    logInfo(NS, {
      event: "payload_ready",
      modeFilter: modeFilter ?? null,
      systemsLoaded: shared.meta.systemsLoadedCount,
      missingSourcesCount: meta.missingSources.length,
      overallStatus: shared.overallStatus,
      highlightsGenerated: meta.highlightsGenerated,
    });

    return payload;
  } catch (e) {
    logInfo(NS, {
      event: "payload_failed",
      message: e instanceof Error ? e.message : String(e),
    });
    return buildEmptyV5Payload(Date.now() - started, e);
  }
}

function buildEmptyV5Payload(dataFreshnessMs: number, err: unknown): CompanyCommandCenterV5Payload {
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
      morningBrief: { ...emptyMorning(), heroSummary: `Partial load: ${msg}`, warnings: [msg] },
      incident: { ...emptyIncident(), incidentSummary: msg },
      launch: { ...emptyLaunch(), warnings: [msg] },
      investor: { ...emptyInvestor(), companySummary: msg },
    },
    meta: {
      currentWindow: { label: "n/a", days: 7, offsetDays: 0 },
      previousWindow: { label: "n/a", days: 7, offsetDays: 1 },
      dataFreshnessMs,
      sourcesUsed: ["control_center_v5:error"],
      missingSources: ["v4_aggregate"],
      highlightsGenerated: 0,
      focusedMode: null,
    },
    v4Echo: { briefingCardCount: 0, digestItemCount: 0, deltaChangedCount: 0 },
  };
}

function emsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
