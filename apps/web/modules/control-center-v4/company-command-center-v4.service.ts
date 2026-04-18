/**
 * V4 — briefing + digest + deltas on top of full V3 aggregate.
 */
import { logInfo } from "@/lib/logger";
import { loadCompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.service";
import type { CommandCenterRole } from "@/modules/control-center-v3/company-command-center-v3.types";
import { buildBriefingCards } from "./briefing/company-command-center-briefing.service";
import type { CompanyCommandCenterV4Meta, CompanyCommandCenterV4Payload, LoadCompanyCommandCenterV4Params } from "./company-command-center-v4.types";
import { buildSystemDeltas } from "./deltas/company-command-center-delta.service";
import { buildAnomalyDigest } from "./digest/company-command-center-anomaly-digest.service";
import { getPresetById, listBuiltInPresets } from "./presets/company-command-center-presets.service";

const NS = "[control-center:v4]";

function parseRole(raw: string | null | undefined): CommandCenterRole | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase().replace(/-/g, "_");
  if (r === "founder" || r === "growth" || r === "operations" || r === "risk_governance") return r;
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export async function loadCompanyCommandCenterV4Payload(
  params: LoadCompanyCommandCenterV4Params = {},
): Promise<CompanyCommandCenterV4Payload> {
  const started = Date.now();
  const days = clamp(params.days ?? 7, 1, 90);
  const limit = clamp(params.limit ?? 10, 1, 50);
  const offsetDays = Math.max(0, params.offsetDays ?? 0);
  const previousOffsetDays = Math.max(1, params.previousOffsetDays ?? 1);

  const preset = getPresetById(params.presetId ?? undefined);
  const roleFromQuery = parseRole(typeof params.role === "string" ? params.role : undefined);
  const activeRole = preset?.role ?? roleFromQuery ?? "founder";

  try {
    const current = await loadCompanyCommandCenterV3Payload({
      days,
      limit,
      offsetDays,
      role: null,
    });

    const previous = await loadCompanyCommandCenterV3Payload({
      days,
      limit,
      offsetDays: offsetDays + previousOffsetDays,
      role: null,
    });

    const { systems, insufficientBaseline, executiveSummary } = buildSystemDeltas(current, previous);
    const { cards } = buildBriefingCards(current, previous);
    const { items, countsBySeverity } = buildAnomalyDigest(current);

    const presets = listBuiltInPresets();

    const meta: CompanyCommandCenterV4Meta = {
      currentWindow: { days, offsetDays, label: `last ${days}d ending offset ${offsetDays}d` },
      previousWindow: {
        days,
        offsetDays: offsetDays + previousOffsetDays,
        label: `last ${days}d ending offset ${offsetDays + previousOffsetDays}d`,
      },
      dataFreshnessMs: Date.now() - started,
      sourcesUsed: [...current.shared.meta.sourcesUsed, "control_center_v4:briefing_digest_delta"],
      missingSources: [...new Set([...current.shared.meta.missingSources, ...(previous.shared.meta.missingSources ?? [])])],
      cardsGenerated: cards.length,
      digestItemCount: items.length,
      deltaSummaryCount: systems.filter((x) => x.changed).length,
      presetId: preset?.id ?? (params.presetId as CompanyCommandCenterV4Meta["presetId"]) ?? null,
      role: activeRole,
    };

    const payload: CompanyCommandCenterV4Payload = {
      v3: current,
      presets,
      activePreset: preset,
      briefing: { cards },
      anomalyDigest: { items, countsBySeverity },
      changesSinceYesterday: {
        systems,
        executiveSummary,
        insufficientBaseline,
      },
      meta,
    };

    logInfo(NS, {
      event: "payload_ready",
      presetId: meta.presetId,
      role: meta.role,
      systemsLoaded: current.shared.meta.systemsLoadedCount,
      missingSourcesCount: meta.missingSources.length,
      cardsGenerated: meta.cardsGenerated,
      digestItems: meta.digestItemCount,
      deltaSummaries: meta.deltaSummaryCount,
    });

    return payload;
  } catch (e) {
    logInfo(NS, {
      event: "payload_failed",
      message: e instanceof Error ? e.message : String(e),
    });
    return buildEmptyV4Payload(Date.now() - started, e, params);
  }
}

function buildEmptyV4Payload(
  dataFreshnessMs: number,
  err: unknown,
  params: LoadCompanyCommandCenterV4Params,
): CompanyCommandCenterV4Payload {
  const msg = emsg(err);

  return {
    v3: {
      shared: {
        overallStatus: "limited",
        systems: null,
        rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
        quickKpis: [],
        meta: {
          dataFreshnessMs,
          sourcesUsed: ["control_center_v4:error"],
          missingSources: ["v3_aggregate"],
          systemsLoadedCount: 0,
          overallStatus: "limited",
          partialData: true,
        },
      },
      roles: {
        founder: {
          role: "founder",
          heroSummary: `Load failed: ${msg}`,
          topPriorities: [],
          topRisks: [],
          topBlockers: [],
          recommendedFocusAreas: [],
          systems: { highlights: [] },
          rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
          warnings: [],
        },
        growth: {
          role: "growth",
          heroSummary: "",
          topPriorities: [],
          topRisks: [],
          topBlockers: [],
          recommendedFocusAreas: [],
          systems: { highlights: [] },
          rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
          warnings: [],
        },
        operations: {
          role: "operations",
          heroSummary: "",
          topPriorities: [],
          topRisks: [],
          topBlockers: [],
          recommendedFocusAreas: [],
          systems: { highlights: [] },
          rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
          warnings: [],
        },
        riskGovernance: {
          role: "risk_governance",
          heroSummary: "",
          topPriorities: [],
          topRisks: [],
          topBlockers: [],
          recommendedFocusAreas: [],
          systems: { highlights: [] },
          rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
          warnings: [],
        },
      },
      focusedRole: null,
    },
    presets: listBuiltInPresets(),
    activePreset: getPresetById(params.presetId ?? undefined),
    briefing: { cards: [] },
    anomalyDigest: {
      items: [],
      countsBySeverity: { info: 0, watch: 0, warning: 0, critical: 0 },
    },
    changesSinceYesterday: {
      systems: [],
      executiveSummary: [`Insufficient data: ${msg}`],
      insufficientBaseline: true,
    },
    meta: {
      currentWindow: { days: 7, offsetDays: 0, label: "n/a" },
      previousWindow: { days: 7, offsetDays: 1, label: "n/a" },
      dataFreshnessMs,
      sourcesUsed: ["control_center_v4:error_fallback"],
      missingSources: ["v4_aggregate"],
      cardsGenerated: 0,
      digestItemCount: 0,
      deltaSummaryCount: 0,
      presetId: null,
      role: parseRole(params.role ?? undefined),
    },
  };
}

function emsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
