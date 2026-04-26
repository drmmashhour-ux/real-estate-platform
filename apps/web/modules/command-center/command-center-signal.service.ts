import type { PlatformRole } from "@prisma/client";

import type {
  IntelligenceFeedItem,
  MarketplaceHealthPayload,
  Signal,
  SignalsByZone,
  SignalSeverity,
  StrategicRecommendation,
} from "./signal.types";
import {
  assistantFollowUp,
  autonomyHref,
  calendarHref,
  dealsHref,
  disputePredictionHref,
  disputesHref,
  growthHref,
  leadsHref,
  navigate,
  reviewCeoAdjustment,
  territoryWarRoomHref,
  trustHref,
} from "./command-center-actions.service";
import type { CommandCenterSummaryPayload } from "./command-center.types";
import { isExecutiveCommandCenter } from "./command-center.types";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

const MAX_PRIMARY_SIGNALS = 6;

const severityRank: Record<SignalSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

function sortSignals(a: Signal, b: Signal): number {
  const s = severityRank[a.severity] - severityRank[b.severity];
  if (s !== 0) return s;
  if (b.impact !== a.impact) return b.impact - a.impact;
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

function zoneForSeverity(sev: SignalSeverity): keyof SignalsByZone {
  if (sev === "CRITICAL") return "critical";
  if (sev === "WARNING") return "attention";
  return "healthy";
}

export function partitionSignalsByZone(signals: Signal[]): SignalsByZone {
  const zones: SignalsByZone = { critical: [], attention: [], healthy: [] };
  for (const sig of signals) {
    zones[zoneForSeverity(sig.severity)].push(sig);
  }
  for (const k of Object.keys(zones) as (keyof SignalsByZone)[]) {
    zones[k].sort(sortSignals);
  }
  return zones;
}

function buildSignalsFromSummary(summary: CommandCenterSummaryPayload, role: PlatformRole): Signal[] {
  const ex = summary.executive;
  const now = summary.generatedAt;
  const signals: Signal[] = [];

  const stalled = summary.stalledDeals.length;
  const priority = summary.priorityDeals.length;

  // Pipeline / deals
  signals.push({
    id: "sig-deal-pipeline",
    domain: "DEAL",
    severity: stalled >= 3 ? "WARNING" : stalled > 0 ? "INFO" : "INFO",
    title: stalled > 0 ? `Pipeline friction — ${stalled} stalled deal(s)` : "Deal pipeline stable",
    value: `${ex.activeDeals} active`,
    delta:
      stalled > 0 ? `${stalled} idle 10+ days`
      : priority > 0 ? `${priority} high-touch`
      : null,
    explanation:
      stalled > 0 ?
        "Stale updates reduce close probability. Re-engage stakeholders and refresh intelligence scores before offers slip."
      : "Active inventory is moving; keep momentum on top-scored opportunities and calendar density.",
    recommendedActions: [
      navigate("View pipeline", dealsHref()),
      ...(stalled > 0 ? [assistantFollowUp(role)] : []),
      navigate("Book visits", calendarHref()),
    ],
    source: { engine: "deal_intelligence" },
    timestamp: now,
    impact: stalled >= 3 ? 78 : stalled > 0 ? 55 : 40,
  });

  // Revenue / growth (advisory)
  signals.push({
    id: "sig-revenue-pipeline",
    domain: "MARKETING",
    severity: ex.revenueTrend === "inactive" ? "WARNING" : "INFO",
    title:
      ex.revenueTrend === "inactive" ? "Pipeline value thin — acquisition needed" : "Pipeline value healthy",
    value: ex.revenueDisplay,
    delta: null,
    explanation:
      ex.revenueTrend === "inactive" ?
        "No meaningful open pipeline aggregate. Feed Growth Machine and listings to refill the top of funnel."
      : "Roll-up reflects active (non-closed) deals — use Growth Machine to compound channel performance.",
    recommendedActions: [
      navigate("Growth Machine", growthHref()),
      navigate("Listing assistant", "/dashboard/lecipm/listings/assistant"),
      ...(isExecutiveCommandCenter(role) ?
        [navigate("Marketing AI daily", "/dashboard/admin/marketing-ai/daily")]
      : []),
    ],
    source: { engine: "marketing_engine" },
    timestamp: now,
    impact: ex.revenueTrend === "inactive" ? 72 : 35,
  });

  // Visits
  signals.push({
    id: "sig-visits",
    domain: "LEAD",
    severity: ex.bookedVisits === 0 ? "WARNING" : "INFO",
    title:
      ex.bookedVisits === 0 ? "No upcoming visits — calendar risk" : `Visit runway: ${ex.bookedVisits} booked`,
    value: String(ex.bookedVisits),
    delta: null,
    explanation:
      ex.bookedVisits === 0 ?
        "Empty forward calendar weakens conversion. Prioritize scheduling for hot leads and stalled deals."
      : "Forward visits protect conversion; confirm reminders to reduce no-shows.",
    recommendedActions: [navigate("Open calendar", calendarHref()), navigate("Hot leads", leadsHref())],
    source: { engine: "visit_booking" },
    timestamp: now,
    impact: ex.bookedVisits === 0 ? 68 : 38,
  });

  // Conversion
  const convNum = parseInt(ex.conversionRateDisplay.replace(/%/g, ""), 10);
  const convSev: SignalSeverity =
    Number.isFinite(convNum) && convNum < 10 ? "WARNING"
    : Number.isFinite(convNum) && convNum < 20 ?
      "INFO"
    : "INFO";
  signals.push({
    id: "sig-conversion",
    domain: "LEAD",
    severity: convSev,
    title:
      Number.isFinite(convNum) && convNum < 10 ?
        "Conversion weak — tighten lead response SLAs"
      : "Conversion within guardrails (30d window)",
    value: ex.conversionRateDisplay,
    delta: null,
    explanation:
      "Conversion compares recent closes to new CRM leads in the rolling window — tune speed-to-lead and visit booking.",
    recommendedActions: [
      navigate("Leads workspace", leadsHref()),
      assistantFollowUp(role),
    ],
    source: { engine: "lead_funnel" },
    timestamp: now,
    impact: Number.isFinite(convNum) ? 100 - Math.min(convNum, 99) : 45,
  });

  // Trust
  const trust = ex.trustScore;
  const trustSev: SignalSeverity =
    trust == null ? "INFO"
    : trust < 50 ? "CRITICAL"
    : trust < 70 ? "WARNING"
    : "INFO";

  signals.push({
    id: "sig-trust",
    domain: "TRUST",
    severity: trustSev,
    title:
      trust == null ? "Trust signal not yet computed for this broker" :
      trust < 50 ? "Operational trust critical — remediate before marketplace exposure"
      : trust < 70 ? "Trust elevated risk — monitor reviews and fulfillment"
      : "Operational trust healthy",
    value: trust != null ? String(trust) : "—",
    delta: ex.trustBand ? `Band: ${ex.trustBand}` : null,
    explanation:
      trust == null ?
        "Snapshots appear after sufficient marketplace interactions — complete onboarding tasks."
      : "Trust blends fulfillment, disputes, and reputation signals; low scores throttle distribution.",
    recommendedActions: [
      navigate("Trust console", trustHref(role)),
      navigate("Open disputes", disputesHref(role)),
    ],
    source: { engine: "trust_score", targetId: "self" },
    timestamp: now,
    impact: trust == null ? 30 : trust < 50 ? 95 : trust < 70 ? 70 : 25,
  });

  // Risk / disputes aggregate
  const openD = summary.trustRisk.openDisputes;
  const riskScore = summary.trustRisk.disputeRiskScore;
  const riskSev: SignalSeverity =
    openD >= 3 ? "CRITICAL"
    : openD >= 1 ? "WARNING"
    : riskScore != null && riskScore > 70 ? "WARNING"
    : "INFO";

  signals.push({
    id: "sig-risk-disputes",
    domain: "RISK",
    severity: riskSev,
    title:
      openD >= 3 ? "Dispute load elevated — executive review" :
      openD >= 1 ? "Open disputes require structured response"
      : riskScore != null && riskScore > 70 ? "Dispute risk model elevated"
      : "Dispute surface quiet",
    value: `${openD} open`,
    delta: riskScore != null ? `Model: ${Math.round(riskScore)}` : null,
    explanation:
      "Disputes and prediction scores inform marketplace health — route high-priority cases before they impact trust.",
    recommendedActions: [
      navigate("Disputes", disputesHref(role)),
      ...(isExecutiveCommandCenter(role) ?
        [navigate("Dispute prediction", disputePredictionHref())]
      : []),
    ],
    source: { engine: "dispute_prediction" },
    timestamp: now,
    impact: openD >= 3 ? 92 : openD >= 1 ? 75 : riskScore != null && riskScore > 70 ? 65 : 28,
  });

  // Automation / AI CEO
  const pendingMatch = ex.automationDisplay.match(/(\d+)/);
  const pending = pendingMatch ? parseInt(pendingMatch[1], 10) : 0;
  const autoSev: SignalSeverity =
    pending > 3 ? "WARNING"
    : pending > 0 ? "INFO"
    : "INFO";

  signals.push({
    id: "sig-automation",
    domain: "EXPANSION",
    severity: autoSev,
    title:
      pending > 0 ? `AI CEO proposals awaiting governance (${pending})` : "Autonomy nominal — no blocking proposals",
    value: ex.automationDisplay,
    delta: null,
    explanation:
      pending > 0 ?
        "System adjustments need human approval with documented rationale — approve or reject in the AI CEO queue."
      : "No pending autonomous policy changes; autopilot remains within approved envelopes.",
    recommendedActions: [
      navigate("Autonomy center", autonomyHref(role)),
      ...(isExecutiveCommandCenter(role) && pending > 0 ?
        [navigate("AI CEO adjustments", "/dashboard/admin/ai-ceo/system-adjustments")]
      : []),
    ],
    source: { engine: "ai_ceo" },
    timestamp: now,
    impact: pending > 3 ? 80 : pending > 0 ? 50 : 22,
  });

  return signals.sort(sortSignals);
}

function buildMarketplaceHealth(summary: CommandCenterSummaryPayload, role: PlatformRole): MarketplaceHealthPayload {
  const trust = summary.executive.trustScore;
  const openD = summary.trustRisk.openDisputes;
  const risk = summary.trustRisk.disputeRiskScore;

  let overallLevel: MarketplaceHealthPayload["overallLevel"] = "healthy";
  if (trust != null && trust < 50) overallLevel = "urgent";
  else if (openD >= 3 || (trust != null && trust < 70) || (risk != null && risk > 75)) overallLevel = "attention";
  if (openD >= 5 || (trust != null && trust < 40)) overallLevel = "urgent";

  const biggestRisks: string[] = [];
  if (openD > 0) biggestRisks.push(`${openD} open dispute(s) need owner and SLA.`);
  if (risk != null && risk > 60) biggestRisks.push(`Dispute prediction model at ${Math.round(risk)} — watch fulfillment.`);
  if (trust != null && trust < 70) biggestRisks.push(`Operational trust ${trust} — below premium distribution threshold.`);
  if (biggestRisks.length === 0) biggestRisks.push("No acute marketplace health risks in the latest snapshot.");

  const biggestImprovements: string[] = [];
  if (trust != null && trust >= 80) biggestImprovements.push("Strong trust band — eligible for broader marketplace surfacing.");
  if (openD === 0) biggestImprovements.push("Clean dispute queue reduces buyer friction.");
  if (summary.stalledDeals.length === 0) biggestImprovements.push("No stalled deals flagged — pipeline hygiene is solid.");
  if (biggestImprovements.length === 0) {
    biggestImprovements.push("Focus on visit density and response speed for incremental gains.");
  }

  return {
    overallLevel,
    headline:
      overallLevel === "urgent" ? "Marketplace health needs executive intervention"
      : overallLevel === "attention" ? "Marketplace health stable with targeted risks"
      : "Marketplace health aligned with growth targets",
    trustScore: trust,
    trustBand: summary.trustRisk.trustBand,
    disputeRiskScore: risk,
    openDisputes: openD,
    biggestRisks: biggestRisks.slice(0, 4),
    biggestImprovements: biggestImprovements.slice(0, 4),
    quickActions: [
      navigate("Trust", trustHref(role)),
      navigate("Disputes", disputesHref(role)),
      ...(isExecutiveCommandCenter(role) ?
        [navigate("Dispute prediction", disputePredictionHref())]
      : []),
    ],
  };
}

async function loadStrategicRecommendations(role: PlatformRole): Promise<StrategicRecommendation[]> {
  if (!isExecutiveCommandCenter(role)) {
    return [
      {
        id: "rec-broker-speed",
        title: "Increase follow-up speed for high-intent leads",
        explanation:
          "Speed-to-lead correlates with visit booking; stale CRM rows decay faster than residential norms.",
        expectedImpact: "Higher visit conversion and shorter sales cycles on priority listings.",
        actions: [navigate("Leads workspace", leadsHref()), assistantFollowUp(role)],
        source: { engine: "aggregated" },
        requiresApproval: false,
      },
      {
        id: "rec-broker-visits",
        title: "Tighten visit confirmation flow",
        explanation:
          "No-show risk drops when reminders and calendar holds are consistent across hot leads.",
        expectedImpact: "Fewer wasted slots and stronger buyer momentum.",
        actions: [navigate("Calendar", calendarHref()), navigate("Hot leads", leadsHref())],
        source: { engine: "aggregated" },
        requiresApproval: false,
      },
    ];
  }

  const proposals = await prisma.lecipmSystemBehaviorAdjustment.findMany({
    where: { status: "PROPOSED" },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      explanation: true,
      affectedDomain: true,
      expectedEffect: true,
      createdAt: true,
    },
  });

  const fromCeo: StrategicRecommendation[] = proposals.map((p) => ({
    id: `ceo-rec-${p.id}`,
    title: p.title,
    explanation:
      (p.explanation?.slice(0, 280) ?? "AI CEO proposes a bounded system adjustment with documented rationale.") +
      (p.affectedDomain ? ` Domain: ${p.affectedDomain}.` : ""),
    expectedImpact: p.expectedEffect?.slice(0, 160) ?? "Operational efficiency and risk-aware automation.",
    actions: [
      reviewCeoAdjustment(p.id),
      navigate("Autonomy overview", autonomyHref(role)),
    ],
    source: { engine: "ai_ceo", adjustmentId: p.id },
    requiresApproval: true,
  }));

  const territory: StrategicRecommendation = {
    id: "rec-territory-expansion",
    title: "Review territory momentum before scaling spend",
    explanation:
      "Expansion phases should follow verified demand signals — align marketing with territory war room data.",
    expectedImpact: "Better CAC and reduced wasted impressions in cold markets.",
    actions: [navigate("Territory war room", territoryWarRoomHref()), navigate("Growth Machine", growthHref())],
    source: { engine: "aggregated" },
    requiresApproval: false,
  };

  return [...fromCeo, territory].slice(0, 6);
}

export type CommandCenterSignalsPayload = {
  signals: Signal[];
  signalsPrimary: Signal[];
  zones: SignalsByZone;
  marketplaceHealth: MarketplaceHealthPayload;
  strategicRecommendations: StrategicRecommendation[];
};

/** Uses preloaded summary to avoid duplicate Prisma round-trips on the command center page. */
export async function loadCommandCenterSignalsPayload(
  summary: CommandCenterSummaryPayload,
  role: PlatformRole,
): Promise<CommandCenterSignalsPayload> {
  const signals = buildSignalsFromSummary(summary, role);
  const signalsPrimary = signals.slice(0, MAX_PRIMARY_SIGNALS);
  const zones = partitionSignalsByZone(signals);
  const marketplaceHealth = buildMarketplaceHealth(summary, role);
  const strategicRecommendations = await loadStrategicRecommendations(role);

  return {
    signals,
    signalsPrimary,
    zones,
    marketplaceHealth,
    strategicRecommendations,
  };
}

