import type { CompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.types";
import type { CommandCenterRolePriority, CommandCenterRoleView } from "../company-command-center-v3.types";
import { capPriorities, stringsToPriorities } from "../control-center-v3-priority-mapper";
import { extractGrowthBottleneckStrings } from "../company-command-center-v3-extraction";

function growthHighlights(v2: CompanyCommandCenterV2Payload) {
  const s = v2.v1.systems;
  return [
    {
      id: "ads",
      label: "Ads V8",
      status: s.ads.status,
      oneLiner: s.ads.summary.slice(0, 140),
    },
    {
      id: "cro",
      label: "CRO V8",
      status: s.cro.status,
      oneLiner: s.cro.summary.slice(0, 140),
    },
    {
      id: "ranking",
      label: "Ranking V8",
      status: s.ranking.status,
      oneLiner: s.ranking.summary.slice(0, 140),
    },
    {
      id: "growth_loop",
      label: "Growth loop",
      status: s.growthLoop.status,
      oneLiner: s.growthLoop.summary.slice(0, 140),
    },
  ];
}

export function mapGrowthRole(v2: CompanyCommandCenterV2Payload): CommandCenterRoleView {
  const g = v2.growth;
  const s = v2.v1.systems;
  const oppIds = g.opportunities.map((_, i) => `g-opp-${i}`);
  const riskIds = g.risks.map((_, i) => `g-risk-${i}`);
  const rankingRec = s.ranking.recommendation ? [s.ranking.recommendation] : [];

  const priorities = capPriorities(
    [
      ...stringsToPriorities(oppIds, g.opportunities),
      ...stringsToPriorities(
        rankingRec.map((_, i) => `rank-rec-${i}`),
        rankingRec,
      ),
    ],
    6,
  );

  const topRisks = capPriorities([...stringsToPriorities(riskIds, g.risks), ...bottleneckRisks(v2)], 6);

  const blockers: CommandCenterRolePriority[] = [];
  if (s.cro.topBottleneck) {
    blockers.push({ id: "cro-bn", label: s.cro.topBottleneck, rationale: "CRO bottleneck" });
  }
  if (s.ads.anomalyNote) {
    blockers.push({ id: "ads-anom", label: s.ads.anomalyNote, rationale: "Ads anomaly" });
  }

  const heroSummary = [
    `Growth stack: Ads (${s.ads.status}), CRO (${s.cro.status}), Ranking (${s.ranking.status}), loop (${s.growthLoop.status}).`,
    s.growthLoop.lastRunStatus ? `Last growth loop run: ${s.growthLoop.lastRunStatus}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    role: "growth",
    heroSummary,
    topPriorities: priorities,
    topRisks,
    topBlockers: capPriorities(blockers, 4),
    recommendedFocusAreas: [
      ...extractGrowthBottleneckStrings(v2),
      ...(s.ranking.readinessGatesOk != null && s.ranking.readinessGatesTotal != null
        ? [`Ranking gates ${s.ranking.readinessGatesOk}/${s.ranking.readinessGatesTotal}`]
        : []),
    ].slice(0, 8),
    systems: { highlights: growthHighlights(v2) },
    rolloutSummary: v2.v1.rolloutSummary,
    warnings: [...v2.v1.unifiedWarnings.filter((w) => /ads|cro|rank|growth/i.test(w))].slice(0, 10),
  };
}

function bottleneckRisks(v2: CompanyCommandCenterV2Payload): CommandCenterRolePriority[] {
  const labels = extractGrowthBottleneckStrings(v2);
  return stringsToPriorities(
    labels.map((_, i) => `bn-${i}`),
    labels,
  );
}
