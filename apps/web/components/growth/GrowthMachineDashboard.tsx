"use client";

import * as React from "react";
import Link from "next/link";
import { FunnelChart } from "./FunnelChart";
import { LeadFunnelCard } from "./LeadFunnelCard";
import { CampaignROICard } from "./CampaignROICard";
import { ListingGrowthCard } from "./ListingGrowthCard";
import { HostGrowthCard } from "./HostGrowthCard";
import { BrokerGrowthCard } from "./BrokerGrowthCard";
import { ReferralPerformanceCard } from "./ReferralPerformanceCard";
import { GrowthActionsPanel } from "./GrowthActionsPanel";
import { GrowthBlockersPanel } from "./GrowthBlockersPanel";
import { GrowthAiAutopilotPanel } from "./GrowthAiAutopilotPanel";
import { GrowthContentStudioPanel } from "./GrowthContentStudioPanel";
import { GrowthInfluencePanel } from "./GrowthInfluencePanel";
import { GrowthFusionPanel } from "./GrowthFusionPanel";
import { GrowthGovernancePanel } from "./GrowthGovernancePanel";
import { GrowthExecutivePanel } from "./GrowthExecutivePanel";
import { GrowthDailyBriefPanel } from "./GrowthDailyBriefPanel";
import { GrowthLearningPanel } from "./GrowthLearningPanel";
import { GrowthLearningControlPanel } from "./GrowthLearningControlPanel";
import { GrowthMultiAgentPanel } from "./GrowthMultiAgentPanel";
import { GrowthLearningAdvisoryStrip } from "./GrowthLearningAdvisoryStrip";
import { GrowthStrategyPanel } from "./GrowthStrategyPanel";
import { GrowthCadencePanel } from "./GrowthCadencePanel";
import { GrowthSimulationPanel } from "./GrowthSimulationPanel";
import { GrowthMissionControlPanel } from "./GrowthMissionControlPanel";
import { GrowthGovernanceConsolePanel } from "./GrowthGovernanceConsolePanel";
import { GrowthKnowledgeGraphPanel } from "./GrowthKnowledgeGraphPanel";
import { GrowthDecisionJournalPanel } from "./GrowthDecisionJournalPanel";
import { GrowthMemoryPanel } from "./GrowthMemoryPanel";
import { GrowthPolicyEnforcementPanel } from "./GrowthPolicyEnforcementPanel";
import { GrowthPolicyEnforcementStatusStrip } from "./GrowthPolicyEnforcementStatusStrip";
import { GrowthPolicyEnforcementRolloutDebugStrip } from "./GrowthPolicyEnforcementRolloutDebugStrip";
import { GrowthAutonomyPanel } from "./GrowthAutonomyPanel";
import { GrowthGovernanceFeedbackPanel } from "./GrowthGovernanceFeedbackPanel";
import { GrowthOperatingReviewPanel } from "./GrowthOperatingReviewPanel";
import { GrowthRevenuePanel } from "./GrowthRevenuePanel";
import { Growth1KPlanPanel } from "./Growth1KPlanPanel";
import { BrokerAcquisitionPanel } from "./BrokerAcquisitionPanel";
import { AdsExecutionPanel } from "./AdsExecutionPanel";
import { FunnelDashboardPanel } from "./FunnelDashboardPanel";
import { DealExecutionPlanPanel } from "./DealExecutionPlanPanel";
import { AdsStarterPlanPanel } from "./AdsStarterPlanPanel";
import { BrokerClosingPanel } from "./BrokerClosingPanel";
import { BrokerSourcingPanel } from "./BrokerSourcingPanel";
import { LeadCaptureLandingPage } from "./LeadCaptureLandingPage";
import { ClosingPlaybookPanel } from "./ClosingPlaybookPanel";
import { FastDealResultsPanel } from "./FastDealResultsPanel";
import { FastDealCityComparisonPanel } from "./FastDealCityComparisonPanel";
import { CityPlaybookAdaptationPanel } from "./CityPlaybookAdaptationPanel";
import { AiExecutionPanel } from "./AiExecutionPanel";
import { ScaleSystemPanel } from "./ScaleSystemPanel";
import { MarketExpansionPanel } from "./MarketExpansionPanel";
import { WeeklyOperatorReviewPanel } from "./WeeklyOperatorReviewPanel";
import { CapitalAllocationPanel } from "./CapitalAllocationPanel";
import { ExecutionPlannerPanel } from "./ExecutionPlannerPanel";
import { TeamCoordinationPanel } from "./TeamCoordinationPanel";
import { AutonomousMissionControlPanel } from "./AutonomousMissionControlPanel";
import { CityDominationPanel } from "./CityDominationPanel";
import { ScaleRoadmapPanel } from "./ScaleRoadmapPanel";
import { MoatPanel } from "./MoatPanel";
import { DailyRoutinePanel } from "./DailyRoutinePanel";
import { ExecutionAccountabilityPanel } from "./ExecutionAccountabilityPanel";
import { DealPerformancePanel } from "./DealPerformancePanel";
import { WeeklyTeamReviewPanel } from "./WeeklyTeamReviewPanel";
import { RevenueForecastPanel } from "./RevenueForecastPanel";
import { MontrealDominationPanel } from "./MontrealDominationPanel";
import { AdaptiveIntelligencePanel } from "./AdaptiveIntelligencePanel";
import { InvestorDashboardPanel } from "../investors/InvestorDashboardPanel";
import { InvestorPitchPanel } from "../investors/InvestorPitchPanel";
import { FundraisingPanel } from "../investors/FundraisingPanel";
import { PitchScriptPanel } from "../investors/PitchScriptPanel";
import { LeadClosingPanel } from "./LeadClosingPanel";
import { BrokerDealClosingPanel } from "./BrokerDealClosingPanel";
import { CompoundingPanel } from "./CompoundingPanel";
import { LeadConversationPanel } from "./LeadConversationPanel";
import { BrokerConversationPanel } from "./BrokerConversationPanel";
import { GhostRecoveryPanel } from "./GhostRecoveryPanel";
import { DealConversationFlow } from "./DealConversationFlow";
import { ClosingPsychologyPanel } from "./ClosingPsychologyPanel";
import { TimingOptimizerPanel } from "./TimingOptimizerPanel";
import { BrokerLockInPanel } from "../brokers/BrokerLockInPanel";
import { GrowthPolicyPanel } from "./GrowthPolicyPanel";
import { LeadFollowUpPanel } from "./LeadFollowUpPanel";
import { BrokerClosingAdvancedPanel } from "./BrokerClosingAdvancedPanel";
import { ScalingBlueprintPanel } from "./ScalingBlueprintPanel";
import { GrowthScalePanels } from "./GrowthScalePanels";
import { CompanyCommandCenterV7 } from "./CompanyCommandCenterV7";
import { CompanyCommandCenterV8 } from "./CompanyCommandCenterV8";
import { BrokerCompetitionPanel } from "../brokers/BrokerCompetitionPanel";
import type { GrowthAutonomyAutoLowRiskRolloutStage } from "@/modules/growth/growth-autonomy-auto.types";
import type { GrowthAutonomyRolloutStage } from "@/modules/growth/growth-autonomy.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import type { GrowthPolicyEnforcementGetResponse } from "@/modules/growth/growth-policy-enforcement-api.types";
import { isGrowthPolicyEnforcementEnabledResponse } from "@/modules/growth/growth-policy-enforcement-api.types";
import type { GrowthContentHubSnapshot } from "@/modules/growth/ai-autopilot-content.types";
import type { InfluenceSnapshot } from "@/modules/growth/ai-autopilot-influence.service";
import type { FunnelReport } from "@/modules/growth-funnel/funnel.types";

type SummaryJson = {
  dashboard: {
    leadsPreview: unknown[];
    campaignsCount: number;
    performance90d: {
      eventCount: number;
      impressions: number;
      clicks: number;
      amountByKey: Record<string, number>;
    };
    referralsCount: number;
    adsLandingMetrics: {
      windowDays: number;
      trafficSourceLabel: string;
      funnelSteps: {
        landing_view: number;
        cta_click: number;
        listing_view: number;
        lead_capture: number;
      };
      leadsFromPublicLanding: number;
      conversionRateViewToLeadPercent: number | null;
      note: string;
    } | null;
  };
  blockers: string[];
};

type FunnelJson = {
  funnels: {
    guest: FunnelReport;
    host: FunnelReport;
    buyer: FunnelReport;
    broker: FunnelReport;
  };
  leadPipeline?: {
    scope: string;
    byPipeline: Record<string, number>;
    note?: string;
  };
};

type AdsLandingFlags = {
  facebookAdsV1: boolean;
  googleAdsV1: boolean;
  landingPagesV1: boolean;
};

export function GrowthMachineDashboard({
  locale,
  country,
  adsLanding,
  aiAutopilot,
  contentAssist,
  influence,
  growthFusion,
  growthGovernance,
  governanceAutopilotBadge,
  growthExecutive,
  growthDailyBrief,
  growthLearning,
  growthLearningAdvisory,
  growthMultiAgent,
  growthStrategy,
  growthCadence,
  growthSimulation,
  growthMissionControl,
  growthMemory,
  growthKnowledgeGraph,
  growthDecisionJournal,
  growthGovernancePolicy,
  growthPolicyEnforcement,
  growthAutonomy,
  growthGovernanceFeedback,
  growthOperatingReviewPanel,
  growthRevenuePanelV1,
  growth1kPlanV1,
  growthDealExecutionPlanV1,
  growthAdsStarterPlanV1,
  growthBrokerClosingV1,
  growthBrokerSourcingV1,
  growthLandingPageV1,
  growthClosingPlaybookV1,
  growthFastDealResultsLoggingV1,
  growthFastDealResultsPanelV1,
  growthFastDealCityComparisonPanelV1,
  growthCityPlaybookAdaptationPanelV1,
  growthLeadFollowupV1,
  growthBrokerClosingAdvancedV1,
  growthScalingBlueprintV1,
  growthAiAssistExecutionV1,
  growthBrokerCompetitionV1,
  growthScaleSystemV1,
  growthExecutionResultsPanelV1,
  growthMarketExpansionPanelV1,
  growthWeeklyReviewPanelV1,
  growthCapitalAllocationPanelV1,
  growthAdaptiveIntelligencePanelV1,
  growthExecutionPlannerPanelV1,
  growthTeamCoordinationPanelV1,
  growthExecutionAccountabilityPanelV1,
  growthExecutionAccountabilitySyncV1,
  growthWeeklyTeamReviewPanelV1,
  growthRevenueForecastPanelV1,
  viewerUserId,
  autonomousMarketplaceV1,
  growthInvestorDashboardPanelV1,
  growthInvestorSharePanelV1,
  investorPitchV1,
  cityDominationV1,
  scaleRoadmapV1,
  fundraisingV1,
  moatEngineV1,
  dailyRoutineV1,
  pitchScriptV1,
  cityDominationMtlV1,
  dealClosingV1,
  compoundingV1,
  conversationEngineV1,
  antiGhostingV1,
  closingPsychologyV1,
  timingOptimizerV1,
  brokerLockinV1,
  growthPolicyV1,
  growthBrokerAcquisitionV1,
  growthAdsEngineV1,
  growthFunnelSystemV1,
  growthScaleV1,
  growth100kV1,
  growth1mV1,
  viewerIsAdmin,
  viewerGrowthAutonomyPilotAccess,
  growthAutonomyEnforcementLayerFlag,
  growthAutonomyLearning,
  growthAutonomyAutoLowRisk,
  growthAutonomyExpansion,
}: {
  locale: string;
  country: string;
  /** When any flag is on, show Ads + landing playbook links (builders + live URLs). */
  adsLanding?: AdsLandingFlags;
  /** FEATURE_AI_AUTOPILOT_* — advisory + optional controlled execution. */
  aiAutopilot?: { enabled: boolean; executionEnabled: boolean; rollbackEnabled?: boolean };
  contentAssist?: boolean;
  /** FEATURE_AI_AUTOPILOT_INFLUENCE_V1 — advisory CRO + ads suggestions (non-destructive). */
  influence?: boolean;
  /** FEATURE_GROWTH_FUSION_V1 — unified fusion panel (read-only). */
  growthFusion?: boolean;
  /** FEATURE_GROWTH_GOVERNANCE_V1 — advisory governance panel. */
  growthGovernance?: boolean;
  /** When governance is on, autopilot shows an advisory badge for freeze/review states. */
  governanceAutopilotBadge?: boolean;
  /** FEATURE_GROWTH_EXECUTIVE_PANEL_V1 — company-level snapshot. */
  growthExecutive?: boolean;
  /** FEATURE_GROWTH_DAILY_BRIEF_V1 — yesterday + today priorities (read-only). */
  growthDailyBrief?: boolean;
  /** FEATURE_GROWTH_LEARNING_V1 — local learning panel. */
  growthLearning?: boolean;
  /** Learning advisory strip above executive/daily brief. */
  growthLearningAdvisory?: boolean;
  /** FEATURE_GROWTH_MULTI_AGENT_V1 — agent coordination panel. */
  growthMultiAgent?: boolean;
  /** FEATURE_GROWTH_STRATEGY_V1 — weekly priorities + optional experiments/roadmap (advisory). */
  growthStrategy?: { enabled: boolean; experiments: boolean; roadmap: boolean };
  /** FEATURE_GROWTH_CADENCE_V1 — daily + weekly operating rhythm (advisory). */
  growthCadence?: boolean;
  /** Growth simulations — what-if panel (requires simulation + panel flags). */
  growthSimulation?: { enabled: boolean; panel: boolean };
  /** Mission control console (requires mission control + panel flags). */
  growthMissionControl?: { enabled: boolean; panel: boolean };
  /** Growth memory panel (requires memory + panel flags). */
  growthMemory?: { enabled: boolean; panel: boolean };
  /** Knowledge graph panel (requires graph + panel flags). */
  growthKnowledgeGraph?: { enabled: boolean; panel: boolean };
  /** Decision journal (requires journal + panel flags; optional bridge for learning strip). */
  growthDecisionJournal?: { enabled: boolean; panel: boolean; bridge?: boolean };
  /** Governance policy console + optional panel badges (policy + console flags). */
  growthGovernancePolicy?: { enabled: boolean; panel: boolean; panelBadges?: boolean };
  /** Bounded advisory enforcement snapshot (feature-gated; default off). */
  growthPolicyEnforcement?: { enabled: boolean; panel: boolean };
  /** Growth autonomy orchestration — OFF / ASSIST / SAFE_AUTOPILOT (advisory-only). */
  growthAutonomy?: {
    enabled: boolean;
    panel: boolean;
    killSwitch: boolean;
    rolloutStage: GrowthAutonomyRolloutStage;
    trialEnabled?: boolean;
    trialPanel?: boolean;
  };
  /** Viewer can bypass internal-rollout gate for autonomy API (admin). */
  viewerIsAdmin?: boolean;
  /** Server-computed: eligible for internal autonomy pilot (admin, allowlist, non-prod, internal UI env). */
  viewerGrowthAutonomyPilotAccess?: boolean;
  /** FEATURE_GROWTH_POLICY_ENFORCEMENT_V1 — surfaced on autonomy rollout strip. */
  growthAutonomyEnforcementLayerFlag?: boolean;
  /** Bounded autonomy learning loop — FEATURE_GROWTH_AUTONOMY_LEARNING_* */
  growthAutonomyLearning?: { enabled: boolean; panel: boolean };
  /** Allowlisted internal auto-actions — FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_* */
  growthAutonomyAutoLowRisk?: {
    enabled: boolean;
    panel: boolean;
    rolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  };
  /** Evidence-based adjacent low-risk expansion governance */
  growthAutonomyExpansion?: {
    enabled: boolean;
    panel: boolean;
  };
  /** Governance feedback memory (advisory; default off). */
  growthGovernanceFeedback?: { enabled: boolean; panel: boolean; bridge: boolean };
  /** Weekly operating review panel — requires `FEATURE_GROWTH_OPERATING_REVIEW_V1` for API data. */
  growthOperatingReviewPanel?: boolean;
  /** FEATURE_GROWTH_REVENUE_PANEL_V1 — read-only revenue dashboard (`/api/growth/revenue`). */
  growthRevenuePanelV1?: boolean;
  /** FEATURE_REVENUE_DASHBOARD_V1 — same revenue dashboard panel (paired with growth revenue flag for API access). */
  revenueDashboardV1?: boolean;
  /** FEATURE_GROWTH_1K_PLAN_V1 — $1K/month execution panel (`/api/growth/1k-plan`). */
  growth1kPlanV1?: boolean;
  growthDealExecutionPlanV1?: boolean;
  growthAdsStarterPlanV1?: boolean;
  growthBrokerClosingV1?: boolean;
  growthBrokerSourcingV1?: boolean;
  growthLandingPageV1?: boolean;
  growthClosingPlaybookV1?: boolean;
  /** FEATURE_FAST_DEAL_RESULTS_V1 — log broker/landing/playbook checkpoints to the results store. */
  growthFastDealResultsLoggingV1?: boolean;
  /** FEATURE_FAST_DEAL_RESULTS_PANEL_V1 — dashboard panel for Fast Deal aggregates. */
  growthFastDealResultsPanelV1?: boolean;
  /** FEATURE_FAST_DEAL_CITY_COMPARISON_PANEL_V1 — city comparison panel (requires city comparison V1). */
  growthFastDealCityComparisonPanelV1?: boolean;
  /** FEATURE_CITY_PLAYBOOK_ADAPTATION_PANEL_V1 — playbook adaptation panel (requires adaptation + city comparison V1). */
  growthCityPlaybookAdaptationPanelV1?: boolean;
  /** FEATURE_LEAD_FOLLOWUP_V1 — lead follow-up copy panel. */
  growthLeadFollowupV1?: boolean;
  /** FEATURE_BROKER_CLOSING_ADVANCED_V1 — broker pressure scripts panel. */
  growthBrokerClosingAdvancedV1?: boolean;
  /** FEATURE_SCALING_BLUEPRINT_V1 — 14-day scaling blueprint. */
  growthScalingBlueprintV1?: boolean;
  /** FEATURE_AI_ASSIST_EXECUTION_V1 — safe scale AI-assist panel. */
  growthAiAssistExecutionV1?: boolean;
  /** FEATURE_BROKER_COMPETITION_V1 — broker competition panel. */
  growthBrokerCompetitionV1?: boolean;
  /** FEATURE_SCALE_SYSTEM_V1 — $100K scale system panel. */
  growthScaleSystemV1?: boolean;
  /** FEATURE_GROWTH_EXECUTION_RESULTS_PANEL_V1 — measurement summary (requires execution results V1). */
  growthExecutionResultsPanelV1?: boolean;
  /** FEATURE_MARKET_EXPANSION_PANEL_V1 — market expansion (requires market expansion + city comparison V1). */
  growthMarketExpansionPanelV1?: boolean;
  /** FEATURE_WEEKLY_REVIEW_PANEL_V1 — weekly operator review (requires weekly review V1). */
  growthWeeklyReviewPanelV1?: boolean;
  /** FEATURE_CAPITAL_ALLOCATION_PANEL_V1 — strategic allocation summary (requires capital allocation V1). */
  growthCapitalAllocationPanelV1?: boolean;
  /** FEATURE_EXECUTION_PLANNER_PANEL_V1 — approval-only Today / This week planner (`FEATURE_EXECUTION_PLANNER_V1`). */
  growthExecutionPlannerPanelV1?: boolean;
  /** FEATURE_TEAM_COORDINATION_PANEL_V1 — team ownership + status (`FEATURE_TEAM_COORDINATION_V1`). */
  growthTeamCoordinationPanelV1?: boolean;
  /** FEATURE_EXECUTION_ACCOUNTABILITY_V1 + PANEL — shared execution rollup (read-only). */
  growthExecutionAccountabilityPanelV1?: boolean;
  /** FEATURE_EXECUTION_ACCOUNTABILITY_V1 — POST checklist sync from routine / Montréal / pitch panels. */
  growthExecutionAccountabilitySyncV1?: boolean;
  /** FEATURE_WEEKLY_TEAM_REVIEW_V1 + panel — leadership weekly team review. */
  growthWeeklyTeamReviewPanelV1?: boolean;
  /** FEATURE_REVENUE_FORECAST_V1 + panel — illustrative CRM-based forecast. */
  growthRevenueForecastPanelV1?: boolean;
  /** Current user id for “my tasks” filters in coordination (optional). */
  viewerUserId?: string;
  /** FEATURE_AUTONOMOUS_MARKETPLACE_V1 — draft decisions + approval + logs. */
  autonomousMarketplaceV1?: boolean;
  /** FEATURE_INVESTOR_DASHBOARD_V1 + panel — auto-generated investor snapshot. */
  growthInvestorDashboardPanelV1?: boolean;
  /** FEATURE_INVESTOR_SHARE_* — read-only public share link management (internal; requires share link + panel flags). */
  growthInvestorSharePanelV1?: boolean;
  /** FEATURE_INVESTOR_PITCH_V1 — static investor slides. */
  investorPitchV1?: boolean;
  /** FEATURE_CITY_DOMINATION_V1 — 30-day city checklist. */
  cityDominationV1?: boolean;
  /** FEATURE_SCALE_ROADMAP_V1 — staged $0→$1M roadmap. */
  scaleRoadmapV1?: boolean;
  /** FEATURE_FUNDRAISING_V1 — fundraising narrative panel. */
  fundraisingV1?: boolean;
  /** FEATURE_MOAT_ENGINE_V1 — moat signals panel. */
  moatEngineV1?: boolean;
  /** FEATURE_DAILY_ROUTINE_V1 — 14-day routine checklist. */
  dailyRoutineV1?: boolean;
  /** FEATURE_PITCH_SCRIPT_V1 — investor pitch scripts. */
  pitchScriptV1?: boolean;
  /** FEATURE_CITY_DOMINATION_MTL_V1 — Montréal 30-day plan. */
  cityDominationMtlV1?: boolean;
  /** FEATURE_DEAL_CLOSING_V1 — lead + broker deal closing scripts. */
  dealClosingV1?: boolean;
  /** FEATURE_COMPOUNDING_V1 — compounding habit checklist. */
  compoundingV1?: boolean;
  /** FEATURE_CONVERSATION_ENGINE_V1 — conversation flows + deal pipeline viz. */
  conversationEngineV1?: boolean;
  /** FEATURE_ANTI_GHOSTING_V1 — ghost recovery templates. */
  antiGhostingV1?: boolean;
  /** FEATURE_CLOSING_PSYCHOLOGY_V1 — ethical closing nudge copy. */
  closingPsychologyV1?: boolean;
  /** FEATURE_TIMING_OPTIMIZER_V1 — advisory timing windows. */
  timingOptimizerV1?: boolean;
  /** FEATURE_BROKER_LOCKIN_V1 — broker dependency + tiers. */
  brokerLockinV1?: boolean;
  /** FEATURE_GROWTH_POLICY_V1 — advisory policy evaluation panel. */
  growthPolicyV1?: boolean;
  /** FEATURE_BROKER_ACQUISITION_V1 — broker pipeline strip + link to admin CRM. */
  growthBrokerAcquisitionV1?: boolean;
  growthAdsEngineV1?: boolean;
  growthFunnelSystemV1?: boolean;
  /** FEATURE_GROWTH_SCALE_V1 — $10K scale panels (`/api/growth/scale`). */
  growthScaleV1?: boolean;
  /** FEATURE_GROWTH_100K_V1 — company command center v7. */
  growth100kV1?: boolean;
  /** FEATURE_GROWTH_1M_V1 — global command center v8. */
  growth1mV1?: boolean;
}) {
  const base = `/${locale}/${country}/dashboard/growth`;
  const [summary, setSummary] = React.useState<SummaryJson | null>(null);
  const [funnel, setFunnel] = React.useState<FunnelJson | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [enforcementSnapshot, setEnforcementSnapshot] = React.useState<GrowthPolicyEnforcementSnapshot | null>(null);
  const [enforcementSnapshotReady, setEnforcementSnapshotReady] = React.useState(
    () => !growthPolicyEnforcement?.enabled,
  );

  React.useEffect(() => {
    if (!growthPolicyEnforcement?.enabled) {
      setEnforcementSnapshot(null);
      setEnforcementSnapshotReady(true);
      return;
    }
    let cancelled = false;
    setEnforcementSnapshotReady(false);
    void fetch("/api/growth/policy-enforcement", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as GrowthPolicyEnforcementGetResponse;
        if (!r.ok) return null;
        if (!isGrowthPolicyEnforcementEnabledResponse(j)) return null;
        return j.snapshot;
      })
      .then((s) => {
        if (!cancelled) setEnforcementSnapshot(s);
      })
      .catch(() => {
        if (!cancelled) setEnforcementSnapshot(null);
      })
      .finally(() => {
        if (!cancelled) setEnforcementSnapshotReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [growthPolicyEnforcement?.enabled]);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetch("/api/growth/reports/summary").then((r) => r.json()),
      fetch("/api/growth/funnel").then((r) => r.json()),
    ])
      .then(([s, f]) => {
        if (cancelled) return;
        if (s.error) throw new Error(s.error);
        if (f.error) throw new Error(f.error);
        setSummary(s);
        setFunnel(f);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!summary || !funnel) {
    return <p className="text-sm text-zinc-500">Loading growth snapshot…</p>;
  }

  const d = summary.dashboard;
  const adFlags = adsLanding;
  const showAdsPlaybook =
    adFlags &&
    (adFlags.landingPagesV1 || adFlags.facebookAdsV1 || adFlags.googleAdsV1);

  const adsLandingDisplay =
    d.adsLandingMetrics ?? {
      windowDays: 90,
      trafficSourceLabel: "Paid ads → LECIPM landing (tracked)",
      funnelSteps: { landing_view: 0, cta_click: 0, listing_view: 0, lead_capture: 0 },
      leadsFromPublicLanding: 0,
      conversionRateViewToLeadPercent: null as number | null,
      note:
        "Summary API omitted ads funnel (flags off or query empty) — showing zeros for UI validation. No synthetic events.",
    };
  const coreFunnelSum =
    adsLandingDisplay.funnelSteps.landing_view +
    adsLandingDisplay.funnelSteps.cta_click +
    adsLandingDisplay.funnelSteps.lead_capture;
  const adsFunnelActive = coreFunnelSum > 0;

  const contentSnapshot = React.useMemo((): GrowthContentHubSnapshot => {
    const campaigns = d.campaignsCount ?? 0;
    return {
      campaign: { name: `Campaigns (${campaigns})`, utmCampaign: undefined },
      leadSegment: "seller",
      listing: undefined,
    };
  }, [d.campaignsCount]);

  const influenceSnapshot = React.useMemo(
    (): InfluenceSnapshot => ({
      conversionRateViewToLeadPercent: adsLandingDisplay.conversionRateViewToLeadPercent,
      funnelSteps: adsLandingDisplay.funnelSteps,
      leadsFromPublicLanding: adsLandingDisplay.leadsFromPublicLanding,
      campaignsCount: d.campaignsCount,
      clicks90d: d.performance90d.clicks,
      impressions90d: d.performance90d.impressions,
    }),
    [adsLandingDisplay, d.campaignsCount, d.performance90d.clicks, d.performance90d.impressions],
  );

  return (
    <div className="space-y-8">
      {growthAdaptiveIntelligencePanelV1 ? <AdaptiveIntelligencePanel /> : null}

      {growthExecutionPlannerPanelV1 ? (
        <div id="growth-mc-execution-planner" className="scroll-mt-24">
          <ExecutionPlannerPanel locale={locale} country={country} />
        </div>
      ) : null}

      {growthTeamCoordinationPanelV1 ? (
        <div id="growth-mc-team-coordination" className="scroll-mt-24">
          <TeamCoordinationPanel locale={locale} country={country} viewerUserId={viewerUserId} />
        </div>
      ) : null}

      {growthExecutionAccountabilityPanelV1 ? (
        <div id="growth-mc-execution-accountability" className="scroll-mt-24">
          <ExecutionAccountabilityPanel />
        </div>
      ) : null}

      {growthExecutionResultsPanelV1 ? <DealPerformancePanel /> : null}

      {growthWeeklyTeamReviewPanelV1 ? <WeeklyTeamReviewPanel /> : null}

      {growthRevenueForecastPanelV1 ? <RevenueForecastPanel /> : null}

      {growthCapitalAllocationPanelV1 ? (
        <div id="growth-mc-capital-allocation" className="scroll-mt-24">
          <CapitalAllocationPanel />
        </div>
      ) : null}

      {showAdsPlaybook && adFlags ? (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <h3 className="text-sm font-semibold text-emerald-200">Ads & landing playbook (v1)</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Human-export builders only — no Meta/Google API keys. Funnel preset:{" "}
            <code className="text-zinc-400">GET /api/marketing-system/v2/funnel-visualization?preset=ads_landing</code>{" "}
            (MI + login). Landings fire{" "}
            <code className="text-zinc-400">POST /api/marketing-system/v2/events</code> with{" "}
            <code className="text-zinc-400">kind: &quot;funnel&quot;</code>,{" "}
            <code className="text-zinc-400">publicAdsLanding: true</code>, and an{" "}
            <code className="text-zinc-400">idempotencyKey</code> (MI + FEATURE_LANDING_PAGES_V1).
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {adFlags.landingPagesV1 ? (
              <li>
                <span className="text-zinc-500">Landings: </span>
                <Link className="text-emerald-400 hover:underline" href={`/${locale}/${country}/ads/bnhub`}>
                  /ads/bnhub
                </Link>
                {" · "}
                <Link className="text-emerald-400 hover:underline" href={`/${locale}/${country}/ads/host`}>
                  /ads/host
                </Link>
                {" · "}
                <Link className="text-emerald-400 hover:underline" href={`/${locale}/${country}/ads/buy`}>
                  /ads/buy
                </Link>
              </li>
            ) : (
              <li className="text-zinc-500">Enable FEATURE_LANDING_PAGES_V1 for public conversion URLs.</li>
            )}
            {adFlags.facebookAdsV1 ? (
              <li>
                <span className="text-zinc-500">Meta setup JSON: </span>
                <code className="break-all text-xs text-zinc-400">
                  GET /api/ads/v1/facebook-setup?campaignType=BNHUB_GUEST&city=Montréal&budget=25
                </code>
              </li>
            ) : null}
            {adFlags.googleAdsV1 ? (
              <li>
                <span className="text-zinc-500">Google structure JSON: </span>
                <code className="break-all text-xs text-zinc-400">
                  GET /api/ads/v1/google-campaign?campaignType=BNHUB_GUEST&city=Montréal
                </code>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
        data-growth-ads-landing-funnel
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-200">Ads landing funnel (platform · 90d)</h3>
          {adsFunnelActive ? (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Active funnel
            </span>
          ) : (
            <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
              Warning: no funnel events
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">{adsLandingDisplay.trafficSourceLabel}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["landing_view", "Landing views", adsLandingDisplay.funnelSteps.landing_view],
              ["cta_click", "CTA clicks", adsLandingDisplay.funnelSteps.cta_click],
              ["lead_capture", "Lead captures (funnel)", adsLandingDisplay.funnelSteps.lead_capture],
              ["listing_view", "Listing views", adsLandingDisplay.funnelSteps.listing_view],
            ] as const
          ).map(([key, label, n]) => (
            <div
              key={key}
              className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2"
              data-growth-funnel-metric={key}
            >
              <p className="text-lg font-semibold text-white">{n}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>
            CRM leads (<code className="text-zinc-500">ads_landing_public</code>):{" "}
            <strong className="text-zinc-200">{adsLandingDisplay.leadsFromPublicLanding}</strong>
          </span>
          <span>
            Conversion rate (view → lead):{" "}
            <strong className="text-zinc-200">
              {adsLandingDisplay.conversionRateViewToLeadPercent != null
                ? `${adsLandingDisplay.conversionRateViewToLeadPercent}%`
                : "—"}
            </strong>
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-600">{adsLandingDisplay.note}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/${locale}/${country}/dashboard/marketing-studio`} className="text-emerald-400 hover:underline">
          Marketing Studio →
        </Link>
        <Link href={`${base}/campaigns`} className="text-zinc-400 hover:text-white">
          Campaigns
        </Link>
        <Link href={`${base}/reports`} className="text-zinc-400 hover:text-white">
          ROI reports
        </Link>
      </div>

      <GrowthPolicyEnforcementStatusStrip
        enforcementEnabled={!!growthPolicyEnforcement?.enabled}
        panelEnabled={!!growthPolicyEnforcement?.panel}
      />

      <GrowthPolicyEnforcementRolloutDebugStrip
        enforcementLayerFlagOn={!!growthPolicyEnforcement?.enabled}
        panelFlagOn={!!growthPolicyEnforcement?.panel}
        enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
        enforcementSnapshotReady={
          !!growthPolicyEnforcement?.enabled ? enforcementSnapshotReady : true
        }
        simulationSectionMounted={!!(growthSimulation?.enabled && growthSimulation?.panel)}
      />

      {growthRevenuePanelV1 || revenueDashboardV1 ? (
        <div id="growth-mc-revenue" className="scroll-mt-24">
          <GrowthRevenuePanel />
        </div>
      ) : null}

      {growth1kPlanV1 ? <Growth1KPlanPanel /> : null}

      {growthDealExecutionPlanV1 ? <DealExecutionPlanPanel /> : null}

      {growthAdsStarterPlanV1 ? <AdsStarterPlanPanel /> : null}

      {growthBrokerClosingV1 ? (
        <div id="growth-mc-broker-closing" className="scroll-mt-24">
          <BrokerClosingPanel />
        </div>
      ) : null}

      {growthBrokerSourcingV1 ? (
        <BrokerSourcingPanel enableFastDealLogging={!!growthFastDealResultsLoggingV1} />
      ) : null}

      {growthLandingPageV1 ? (
        <LeadCaptureLandingPage
          locale={locale}
          country={country}
          enableFastDealLogging={!!growthFastDealResultsLoggingV1}
        />
      ) : null}

      {growthClosingPlaybookV1 ? (
        <ClosingPlaybookPanel enableFastDealLogging={!!growthFastDealResultsLoggingV1} />
      ) : null}

      {growthFastDealResultsPanelV1 ? <FastDealResultsPanel /> : null}

      {growthFastDealCityComparisonPanelV1 ? (
        <div id="growth-mc-fast-deal-city" className="scroll-mt-24">
          <FastDealCityComparisonPanel />
        </div>
      ) : null}

      {growthCityPlaybookAdaptationPanelV1 ? <CityPlaybookAdaptationPanel /> : null}

      {growthMarketExpansionPanelV1 ? (
        <div id="growth-mc-market-expansion" className="scroll-mt-24">
          <MarketExpansionPanel />
        </div>
      ) : null}

      {growthWeeklyReviewPanelV1 ? <WeeklyOperatorReviewPanel /> : null}

      {growthLeadFollowupV1 ? <LeadFollowUpPanel /> : null}

      {growthBrokerClosingAdvancedV1 ? <BrokerClosingAdvancedPanel /> : null}

      {growthScalingBlueprintV1 ? <ScalingBlueprintPanel /> : null}

      {growthBrokerAcquisitionV1 ? <BrokerAcquisitionPanel locale={locale} country={country} /> : null}

      {growthAdsEngineV1 ? <AdsExecutionPanel /> : null}

      {growthFunnelSystemV1 ? <FunnelDashboardPanel locale={locale} country={country} /> : null}

      {growthAiAssistExecutionV1 ? <AiExecutionPanel /> : null}

      {growthBrokerCompetitionV1 ? <BrokerCompetitionPanel /> : null}

      {growthScaleSystemV1 ? <ScaleSystemPanel /> : null}

      {autonomousMarketplaceV1 ? <AutonomousMissionControlPanel /> : null}
      {growthInvestorDashboardPanelV1 ? (
        <InvestorDashboardPanel sharePanelEnabled={!!growthInvestorSharePanelV1} />
      ) : null}
      {investorPitchV1 ? <InvestorPitchPanel /> : null}
      {cityDominationV1 ? (
        <div id="growth-mc-city-domination" className="scroll-mt-24">
          <CityDominationPanel />
        </div>
      ) : null}
      {scaleRoadmapV1 ? <ScaleRoadmapPanel /> : null}
      {fundraisingV1 ? <FundraisingPanel /> : null}
      {moatEngineV1 ? <MoatPanel /> : null}
      {dailyRoutineV1 ? (
        <DailyRoutinePanel
          executionAccountabilitySync={!!growthExecutionAccountabilitySyncV1}
          viewerUserId={viewerUserId}
        />
      ) : null}
      {pitchScriptV1 ? (
        <PitchScriptPanel
          executionAccountabilitySync={!!growthExecutionAccountabilitySyncV1}
          viewerUserId={viewerUserId}
        />
      ) : null}
      {cityDominationMtlV1 ? (
        <MontrealDominationPanel
          executionAccountabilitySync={!!growthExecutionAccountabilitySyncV1}
          viewerUserId={viewerUserId}
        />
      ) : null}
      {dealClosingV1 ? <LeadClosingPanel /> : null}
      {dealClosingV1 ? <BrokerDealClosingPanel /> : null}
      {compoundingV1 ? <CompoundingPanel /> : null}
      {conversationEngineV1 ? <DealConversationFlow /> : null}
      {conversationEngineV1 ? <LeadConversationPanel /> : null}
      {conversationEngineV1 ? <BrokerConversationPanel /> : null}
      {antiGhostingV1 ? <GhostRecoveryPanel /> : null}
      {closingPsychologyV1 ? <ClosingPsychologyPanel /> : null}
      {timingOptimizerV1 ? <TimingOptimizerPanel /> : null}
      {brokerLockinV1 ? <BrokerLockInPanel /> : null}

      {growthScaleV1 ? <GrowthScalePanels /> : null}

      {growth100kV1 ? <CompanyCommandCenterV7 /> : null}

      {growth1mV1 ? <CompanyCommandCenterV8 /> : null}

      <GrowthBlockersPanel lines={summary.blockers} />

      {growthAutonomy ? (
        <GrowthAutonomyPanel
          locale={locale}
          country={country}
          autonomyEnabled={growthAutonomy.enabled}
          panelEnabled={growthAutonomy.panel}
          killSwitch={growthAutonomy.killSwitch}
          rolloutStage={growthAutonomy.rolloutStage}
          enforcementEnabled={!!growthPolicyEnforcement?.enabled}
          enforcementLayerFlagOn={!!growthAutonomyEnforcementLayerFlag}
          viewerIsAdmin={!!viewerIsAdmin}
          viewerGrowthAutonomyPilotAccess={!!viewerGrowthAutonomyPilotAccess}
          learningFeatureEnabled={!!growthAutonomyLearning?.enabled}
          learningPanelVisible={!!growthAutonomyLearning?.panel}
          autoLowRiskFeatureEnabled={!!growthAutonomyAutoLowRisk?.enabled}
          autoLowRiskPanelVisible={!!growthAutonomyAutoLowRisk?.panel}
          autoLowRiskRolloutStage={growthAutonomyAutoLowRisk?.rolloutStage ?? "off"}
          expansionFeatureEnabled={!!growthAutonomyExpansion?.enabled}
          expansionPanelVisible={!!growthAutonomyExpansion?.panel}
          trialFeatureEnabled={!!growthAutonomy?.trialEnabled}
          trialPanelVisible={!!growthAutonomy?.trialPanel}
        />
      ) : null}

      {growthLearningAdvisory && (growthExecutive || growthDailyBrief) ? <GrowthLearningAdvisoryStrip /> : null}

      {growthCadence ? (
        <div id="growth-mc-cadence" className="scroll-mt-24">
          <GrowthCadencePanel />
        </div>
      ) : null}

      {growthPolicyEnforcement?.enabled && growthPolicyEnforcement?.panel ? (
        <div id="growth-mc-policy-enforcement" className="scroll-mt-24">
          <GrowthPolicyEnforcementPanel />
        </div>
      ) : null}

      {growthGovernanceFeedback?.enabled && growthGovernanceFeedback?.panel ? <GrowthGovernanceFeedbackPanel /> : null}

      {growthMissionControl?.enabled && growthMissionControl?.panel ? (
        <GrowthMissionControlPanel
          locale={locale}
          country={country}
          policyBadgeEnabled={!!growthGovernancePolicy?.enabled && !!growthGovernancePolicy?.panelBadges}
          enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
        />
      ) : null}

      {growthOperatingReviewPanel ? (
        <div id="growth-mc-operating-review" className="scroll-mt-24">
          <GrowthOperatingReviewPanel />
        </div>
      ) : null}

      {growthMemory?.enabled && growthMemory?.panel ? (
        <div id="growth-mc-memory" className="scroll-mt-24">
          <GrowthMemoryPanel />
        </div>
      ) : null}

      {growthKnowledgeGraph?.enabled && growthKnowledgeGraph?.panel ? (
        <div id="growth-mc-graph" className="scroll-mt-24">
          <GrowthKnowledgeGraphPanel />
        </div>
      ) : null}

      {growthSimulation?.enabled && growthSimulation?.panel ? (
        <div id="growth-mc-simulation" className="scroll-mt-24">
          <GrowthSimulationPanel
            enforcementLayerEnabled={!!growthPolicyEnforcement?.enabled}
            enforcementSnapshotReady={!!growthPolicyEnforcement?.enabled ? enforcementSnapshotReady : true}
            enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
          />
        </div>
      ) : null}

      {growthExecutive ? (
        <div id="growth-mc-executive" className="scroll-mt-24">
          <GrowthExecutivePanel
            showLearningControlReviewLine={!!growthLearning && !!growthExecutive}
          />
        </div>
      ) : null}

      {growthDailyBrief ? (
        <div id="growth-mc-daily-brief" className="scroll-mt-24">
          <GrowthDailyBriefPanel />
        </div>
      ) : null}

      {growthStrategy?.enabled ? (
        <div id="growth-mc-strategy" className="scroll-mt-24">
          <GrowthStrategyPanel
            experimentsEnabled={!!growthStrategy.experiments}
            roadmapEnabled={!!growthStrategy.roadmap}
            enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
          />
        </div>
      ) : null}

      {growthLearning ? (
        <div id="growth-mc-learning" className="scroll-mt-24">
          <GrowthLearningPanel
            policyBadgeEnabled={!!growthGovernancePolicy?.enabled && !!growthGovernancePolicy?.panelBadges}
            enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
            decisionJournalBridge={
              !!growthDecisionJournal?.enabled &&
              !!growthDecisionJournal?.panel &&
              !!growthDecisionJournal?.bridge
            }
          />
        </div>
      ) : null}

      {growthLearning ? <GrowthLearningControlPanel /> : null}

      {growthMultiAgent ? (
        <div id="growth-mc-multi-agent" className="scroll-mt-24">
          <GrowthMultiAgentPanel />
        </div>
      ) : null}

      {growthFusion ? (
        <div id="growth-mc-fusion" className="scroll-mt-24">
          <GrowthFusionPanel enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null} />
        </div>
      ) : null}

      {growthGovernance ? (
        <div id="growth-mc-governance" className="scroll-mt-24">
          <GrowthGovernancePanel />
        </div>
      ) : null}

      {growthPolicyV1 ? <GrowthPolicyPanel /> : null}

      {growthGovernancePolicy?.enabled && growthGovernancePolicy?.panel ? (
        <div id="growth-mc-governance-console" className="scroll-mt-24">
          <GrowthGovernanceConsolePanel />
        </div>
      ) : null}

      {influence ? (
        <GrowthInfluencePanel
          snapshot={influenceSnapshot}
          base={base}
          aiAutopilotEnabled={!!aiAutopilot?.enabled}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <CampaignROICard
          campaignsCount={d.campaignsCount}
          performance={d.performance90d}
        />
        <ReferralPerformanceCard
          count={d.referralsCount}
          basePath={base}
          referralsHubPath={`/${locale}/${country}/dashboard/referrals`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadFunnelCard leadPipeline={funnel.leadPipeline} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Broker platform funnel (snapshot)</h3>
          <div className="mt-3">
            <FunnelChart report={funnel.funnels.broker} title="Broker" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ListingGrowthCard basePath={base} />
        <div id="growth-mc-host-bnhub" className="scroll-mt-24">
          <HostGrowthCard locale={locale} country={country} />
        </div>
        <BrokerGrowthCard locale={locale} country={country} />
      </div>

      <GrowthActionsPanel />

      {contentAssist ? (
        <GrowthContentStudioPanel
          snapshot={contentSnapshot}
          enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
        />
      ) : null}

      {aiAutopilot?.enabled ? (
        <GrowthAiAutopilotPanel
          executionEnabled={!!aiAutopilot.executionEnabled}
          rollbackEnabled={!!aiAutopilot.rollbackEnabled}
          governanceAdvisoryBadge={!!governanceAutopilotBadge}
          policyBadgeEnabled={!!growthGovernancePolicy?.enabled && !!growthGovernancePolicy?.panelBadges}
          enforcementSnapshot={growthPolicyEnforcement?.enabled ? enforcementSnapshot : null}
        />
      ) : null}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">Recent leads (scoped)</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {d.leadsPreview.length === 0 ? (
            <li>No leads in this scope yet.</li>
          ) : (
            (d.leadsPreview as { id: string; name: string | null; pipelineStatus: string | null }[]).map((l) => (
              <li key={l.id} className="flex justify-between gap-2 border-b border-zinc-800/80 py-1">
                <span className="text-zinc-200">{l.name ?? "—"}</span>
                <span className="text-xs uppercase text-zinc-500">{l.pipelineStatus ?? "—"}</span>
              </li>
            ))
          )}
        </ul>
        <Link href={`${base}/leads`} className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
          View all →
        </Link>
      </div>
    </div>
  );
}
