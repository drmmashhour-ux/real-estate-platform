/**
 * V3 — role-mapped views over the V2 aggregate (single load of underlying systems).
 */
import { logInfo } from "@/lib/logger";
import { loadCompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.service";
import type {
  CompanyCommandCenterV3Payload,
  CompanyCommandCenterV3Roles,
  CommandCenterRole,
  CommandCenterRoleView,
  LoadCompanyCommandCenterV3Params,
} from "./company-command-center-v3.types";
import { mapFounderRole } from "./role-mappers/founder-role-mapper";
import { mapGrowthRole } from "./role-mappers/growth-role-mapper";
import { mapOperationsRole } from "./role-mappers/operations-role-mapper";
import { mapRiskGovernanceRole } from "./role-mappers/risk-governance-role-mapper";

const NS = "[control-center:v3]";

function parseRole(raw: string | null | undefined): CommandCenterRole | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase().replace(/-/g, "_");
  if (r === "founder" || r === "growth" || r === "operations" || r === "risk_governance") return r;
  return null;
}

function emptyRole(role: CommandCenterRole): CommandCenterRoleView {
  return {
    role,
    heroSummary: "Data unavailable for this view.",
    topPriorities: [],
    topRisks: [],
    topBlockers: [],
    recommendedFocusAreas: [],
    systems: { highlights: [] },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    warnings: [],
  };
}

function narrowRolesToFocus(focus: CommandCenterRole, full: CompanyCommandCenterV3Roles): CompanyCommandCenterV3Roles {
  const shell = (r: CommandCenterRole): CommandCenterRoleView => ({ ...emptyRole(r), role: r });
  return {
    founder: focus === "founder" ? full.founder : shell("founder"),
    growth: focus === "growth" ? full.growth : shell("growth"),
    operations: focus === "operations" ? full.operations : shell("operations"),
    riskGovernance: focus === "risk_governance" ? full.riskGovernance : shell("risk_governance"),
  };
}

function emsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function buildEmptyV3Payload(dataFreshnessMs: number, err: unknown): CompanyCommandCenterV3Payload {
  const msg = emsg(err);
  logInfo(NS, { event: "empty_payload", detail: msg });
  const shell = (role: CommandCenterRole): CommandCenterRoleView => ({
    ...emptyRole(role),
    heroSummary: `Partial load: ${msg}`,
    warnings: ["Aggregate failed — check logs and V1/V2 availability."],
  });
  return {
    shared: {
      overallStatus: "limited",
      systems: null,
      rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
      quickKpis: [],
      meta: {
        dataFreshnessMs,
        sourcesUsed: ["control_center_v3:error_fallback"],
        missingSources: ["v2_aggregate"],
        systemsLoadedCount: 0,
        overallStatus: "limited",
        partialData: true,
      },
    },
    roles: {
      founder: shell("founder"),
      growth: shell("growth"),
      operations: shell("operations"),
      riskGovernance: shell("risk_governance"),
    },
    focusedRole: null,
  };
}

export async function loadCompanyCommandCenterV3Payload(
  params: LoadCompanyCommandCenterV3Params = {},
): Promise<CompanyCommandCenterV3Payload> {
  const started = Date.now();
  const roleFilter = parseRole(params.role ?? undefined);

  try {
    const v2 = await loadCompanyCommandCenterV2Payload({
      days: params.days,
      limit: params.limit,
      offsetDays: params.offsetDays,
    });

    const founder = mapFounderRole(v2);
    const growth = mapGrowthRole(v2);
    const operations = mapOperationsRole(v2);
    const riskGovernance = mapRiskGovernanceRole(v2);

    const shared = {
      overallStatus: v2.v1.executiveSummary.overallStatus,
      systems: v2.v1.systems,
      rolloutSummary: v2.v1.rolloutSummary,
      quickKpis: v2.executive.quickKpis,
      meta: {
        dataFreshnessMs: Date.now() - started,
        sourcesUsed: [...v2.meta.sourcesUsed, "control_center_v3:role_map"],
        missingSources: v2.meta.missingSources,
        systemsLoadedCount: v2.meta.systemsLoadedCount,
        overallStatus: v2.meta.overallStatus,
        partialData: v2.meta.partialData,
      },
    };

    const fullRoles: CompanyCommandCenterV3Roles = { founder, growth, operations, riskGovernance };
    const roles = roleFilter ? narrowRolesToFocus(roleFilter, fullRoles) : fullRoles;

    const payload: CompanyCommandCenterV3Payload = {
      shared,
      roles,
      focusedRole: roleFilter,
    };

    logInfo(NS, {
      event: "payload_ready",
      roleFilter: roleFilter ?? null,
      systemsLoaded: shared.meta.systemsLoadedCount,
      missingSourcesCount: shared.meta.missingSources.length,
      overallStatus: shared.meta.overallStatus,
    });

    return payload;
  } catch (e) {
    logInfo(NS, {
      event: "payload_failed",
      message: e instanceof Error ? e.message : String(e),
    });
    return buildEmptyV3Payload(Date.now() - started, e);
  }
}
