import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import {
  revenueEnforcementFlags,
  aiAutopilotContentAssistFlags,
  aiAutopilotInfluenceFlags,
  aiGrowthAutopilotSafeFlags,
  growthFusionFlags,
  growthGovernanceFlags,
  growthExecutiveFlags,
  growthDailyBriefFlags,
  growthLearningFlags,
  growthMultiAgentFlags,
  growthStrategyFlags,
  growthCadenceFlags,
  growthSimulationFlags,
  growthMissionControlFlags,
  growthMemoryFlags,
  growthKnowledgeGraphFlags,
  growthDecisionJournalFlags,
  growthGovernancePolicyFlags,
  growthPolicyEnforcementFlags,
  growthAutonomyFlags,
  growthGovernanceFeedbackFlags,
  growthOperatingReviewFlags,
  autonomousGrowthFlags,
  engineFlags,
  brokerClosingFlags,
  globalFusionFlags,
  landingConversionFlags,
  marketplaceIntelligenceFlags,
  marketplaceFlywheelFlags,
  leadPricingResultsFlags,
  operatorLayerFlags,
  operatorV2Flags,
  platformCoreFlags,
  swarmSystemFlags,
} from "@/config/feature-flags";
import { parseGrowthAutonomyAutoLowRiskRolloutFromEnv } from "@/modules/growth/growth-autonomy-auto-config";
import { parseGrowthAutonomyRolloutFromEnv } from "@/modules/growth/growth-autonomy-config";
import { computeGrowthAutonomyViewerPilotAccess } from "@/modules/growth/growth-autonomy-internal-access";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { buildAssistantRecommendationFeed } from "@/modules/operator/assistant-aggregator.service";
import { isExternallySyncableBudgetAction } from "@/modules/operator/operator-execution.types";
import { getLatestSyncLogsForRecommendations } from "@/modules/operator/operator-external-sync.repository";
import { getProviderConfigHealth } from "@/modules/operator/provider-sync/provider-config.service";
import { AiAssistantLayerSection } from "@/components/growth/AiAssistantLayerSection";
import { GrowthEngineV4Section } from "@/components/growth/GrowthEngineV4Section";
import { GrowthAdsLaunchSection } from "@/components/growth/GrowthAdsLaunchSection";
import { AbTestingDashboard } from "@/components/growth/AbTestingDashboard";
import { GrowthAutomationLoopSection } from "@/components/growth/GrowthAutomationLoopSection";
import { GrowthFusionSystemSection } from "@/components/growth/GrowthFusionSystemSection";
import { GlobalFusionLayerSection } from "@/components/growth/GlobalFusionLayerSection";
import { GrowthAdsAiAutopilotSection } from "@/components/growth/GrowthAdsAiAutopilotSection";
import { GrowthAdsPerformanceSection } from "@/components/growth/GrowthAdsPerformanceSection";
import { GrowthAdsStrategyPlaybook } from "@/components/growth/GrowthAdsStrategyPlaybook";
import { GrowthBookingAccelerationSection } from "@/components/growth/GrowthBookingAccelerationSection";
import { GrowthConversionOptimizationSection } from "@/components/growth/GrowthConversionOptimizationSection";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";
import { GrowthMachineDashboard } from "@/components/growth/GrowthMachineDashboard";
import { GrowthRetargetingEngineSection } from "@/components/growth/GrowthRetargetingEngineSection";
import { MarketplaceIntelligenceSection } from "@/components/growth/MarketplaceIntelligenceSection";
import { MarketplaceFlywheelSection } from "@/components/growth/MarketplaceFlywheelSection";
import { LeadPricingModePerformancePanel } from "@/components/growth/LeadPricingModePerformancePanel";
import { SwarmSystemSection } from "@/components/growth/SwarmSystemSection";
import { PlatformCoreSectionWithBrainV8Overlay } from "@/components/growth/PlatformCoreSectionWithBrainV8Overlay";
import { AutonomousGrowthSystemSection } from "@/components/growth/AutonomousGrowthSystemSection";

export const dynamic = "force-dynamic";

export default async function GrowthMachineHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const dashBase = `/${locale}/${country}/dashboard`;

  const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const canApproveAssistant =
    operatorLayerFlags.operatorApprovalsV1 && userRow?.role === PlatformRole.ADMIN;
  const isAdmin = userRow?.role === PlatformRole.ADMIN;
  const viewerGrowthAutonomyPilotAccess = computeGrowthAutonomyViewerPilotAccess({
    userId,
    role: userRow?.role,
  });
  const platformCoreMutate = !!isAdmin && platformCoreFlags.platformCoreV1;
  const platformCoreApprove = platformCoreMutate && platformCoreFlags.platformCoreApprovalsV1;
  const platformCoreExecute = platformCoreMutate && platformCoreFlags.platformCoreExecutionV1;
  const assistantFeed =
    operatorLayerFlags.aiAssistantLayerV1 ? await buildAssistantRecommendationFeed() : null;

  let operatorV2Context:
    | { providerHealth: ReturnType<typeof getProviderConfigHealth>; latestSyncByRecommendationId: Awaited<ReturnType<typeof getLatestSyncLogsForRecommendations>> }
    | undefined;
  if (assistantFeed && operatorV2Flags.operatorV2BudgetSyncV1) {
    const providerHealth = getProviderConfigHealth();
    const ids = new Set<string>();
    for (const r of assistantFeed.topRecommendations) {
      if (isExternallySyncableBudgetAction(r.actionType)) ids.add(r.id);
    }
    for (const { recommendation: r } of assistantFeed.blockedRecommendations) {
      if (isExternallySyncableBudgetAction(r.actionType)) ids.add(r.id);
    }
    for (const r of assistantFeed.monitoringOnly) {
      if (isExternallySyncableBudgetAction(r.actionType)) ids.add(r.id);
    }
    const latestSyncByRecommendationId = await getLatestSyncLogsForRecommendations([...ids]);
    operatorV2Context = { providerHealth, latestSyncByRecommendationId };
  }

  if (!engineFlags.growthMachineV1) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Growth machine</h1>
        <p className="text-sm text-zinc-400">
          Enable <code className="rounded bg-zinc-800 px-1">FEATURE_GROWTH_MACHINE_V1=true</code> for the connected
          acquisition, nurture, and reporting hub.
        </p>
        <Link href={dashBase} className="text-sm text-emerald-400 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/90">LECIPM Growth OS</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Growth machine</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Real metrics from stored leads, campaigns, referrals, and performance events — no synthetic ROI. High-impact
          outreach stays review-only until you approve it in CRM or Marketing Studio.
        </p>
      </div>
      {isAdmin ? <HubJourneyBanner hub="admin" locale={locale} country={country} userId={userId} /> : null}
      <GrowthAdsStrategyPlaybook />
      {autonomousGrowthFlags.autonomousGrowthSystemV1 ? (
        <AutonomousGrowthSystemSection isAdmin={!!isAdmin} />
      ) : null}
      {assistantFeed ? (
        <AiAssistantLayerSection
          feed={assistantFeed}
          canApprove={!!canApproveAssistant}
          operatorV2={operatorV2Context}
        />
      ) : null}
      {engineFlags.growthMachineV1 && platformCoreFlags.platformCoreV1 ? (
        <PlatformCoreSectionWithBrainV8Overlay
          canApprove={!!platformCoreApprove}
          canExecute={!!platformCoreExecute}
          canMutate={!!platformCoreMutate}
          operatorProviderHealth={operatorV2Context?.providerHealth ?? null}
        />
      ) : null}
      {engineFlags.growthEngineV4 ? <GrowthEngineV4Section userId={userId} /> : null}
      {marketplaceIntelligenceFlags.marketplaceIntelligenceV1 ? <MarketplaceIntelligenceSection /> : null}
      {marketplaceFlywheelFlags.marketplaceFlywheelV1 && isAdmin ? <MarketplaceFlywheelSection /> : null}
      {leadPricingResultsFlags.leadPricingResultsV1 && isAdmin ? <LeadPricingModePerformancePanel /> : null}
      <GrowthAdsPerformanceSection locale={locale} country={country} />
      <GrowthAutomationLoopSection />
      <GrowthFusionSystemSection />
      {globalFusionFlags.globalFusionV1 ? <GlobalFusionLayerSection /> : null}
      {swarmSystemFlags.swarmSystemV1 ? <SwarmSystemSection isAdmin={!!isAdmin} /> : null}
      <AbTestingDashboard locale={locale} country={country} />
      <GrowthAdsAiAutopilotSection />
      <GrowthAdsLaunchSection locale={locale} country={country} />
      <GrowthRetargetingEngineSection />
      <GrowthBookingAccelerationSection />
      <GrowthConversionOptimizationSection locale={locale} country={country} />
      <GrowthMachineDashboard
        locale={locale}
        country={country}
        adsLanding={landingConversionFlags}
        contentAssist={aiAutopilotContentAssistFlags.contentAssistV1}
        influence={aiAutopilotInfluenceFlags.influenceV1}
        aiAutopilot={{
          enabled: aiGrowthAutopilotSafeFlags.aiAutopilotV1,
          executionEnabled: aiGrowthAutopilotSafeFlags.aiAutopilotExecutionV1,
          rollbackEnabled: aiGrowthAutopilotSafeFlags.aiAutopilotRollbackV1,
        }}
        growthFusion={growthFusionFlags.growthFusionV1}
        growthGovernance={growthGovernanceFlags.growthGovernanceV1}
        governanceAutopilotBadge={growthGovernanceFlags.growthGovernanceV1}
        growthExecutive={growthExecutiveFlags.growthExecutivePanelV1}
        growthDailyBrief={growthDailyBriefFlags.growthDailyBriefV1}
        growthLearning={growthLearningFlags.growthLearningV1}
        growthLearningAdvisory={
          growthLearningFlags.growthLearningV1 &&
          (growthExecutiveFlags.growthExecutivePanelV1 || growthDailyBriefFlags.growthDailyBriefV1)
        }
        growthMultiAgent={growthMultiAgentFlags.growthMultiAgentV1}
        growthStrategy={{
          enabled: growthStrategyFlags.growthStrategyV1,
          experiments: growthStrategyFlags.growthStrategyExperimentsV1,
          roadmap: growthStrategyFlags.growthStrategyRoadmapV1,
        }}
        growthCadence={growthCadenceFlags.growthCadenceV1}
        growthSimulation={{
          enabled: growthSimulationFlags.growthSimulationV1,
          panel: growthSimulationFlags.growthSimulationPanelV1,
        }}
        growthMissionControl={{
          enabled: growthMissionControlFlags.growthMissionControlV1,
          panel: growthMissionControlFlags.growthMissionControlPanelV1,
        }}
        growthMemory={{
          enabled: growthMemoryFlags.growthMemoryV1,
          panel: growthMemoryFlags.growthMemoryPanelV1,
        }}
        growthKnowledgeGraph={{
          enabled: growthKnowledgeGraphFlags.growthKnowledgeGraphV1,
          panel: growthKnowledgeGraphFlags.growthKnowledgeGraphPanelV1,
        }}
        growthDecisionJournal={{
          enabled: growthDecisionJournalFlags.growthDecisionJournalV1,
          panel: growthDecisionJournalFlags.growthDecisionJournalPanelV1,
          bridge: growthDecisionJournalFlags.growthDecisionJournalBridgeV1,
        }}
        growthGovernancePolicy={{
          enabled: growthGovernancePolicyFlags.growthGovernancePolicyV1,
          panel: growthGovernancePolicyFlags.growthGovernanceConsolePanelV1,
          panelBadges:
            growthGovernancePolicyFlags.growthGovernancePolicyV1 &&
            growthGovernancePolicyFlags.growthGovernanceConsolePanelV1,
        }}
        growthPolicyEnforcement={{
          enabled: growthPolicyEnforcementFlags.growthPolicyEnforcementV1,
          panel: growthPolicyEnforcementFlags.growthPolicyEnforcementPanelV1,
        }}
        growthAutonomy={{
          enabled: growthAutonomyFlags.growthAutonomyV1,
          panel: growthAutonomyFlags.growthAutonomyPanelV1,
          killSwitch: growthAutonomyFlags.growthAutonomyKillSwitch,
          rolloutStage: parseGrowthAutonomyRolloutFromEnv(),
          trialEnabled: growthAutonomyFlags.growthAutonomyTrialV1,
          trialPanel: growthAutonomyFlags.growthAutonomyTrialPanelV1,
        }}
        growthAutonomyLearning={{
          enabled: growthAutonomyFlags.growthAutonomyLearningV1,
          panel: growthAutonomyFlags.growthAutonomyLearningPanelV1,
        }}
        growthAutonomyAutoLowRisk={{
          enabled: growthAutonomyFlags.growthAutonomyAutoLowRiskV1,
          panel: growthAutonomyFlags.growthAutonomyAutoLowRiskPanelV1,
          rolloutStage: parseGrowthAutonomyAutoLowRiskRolloutFromEnv(),
        }}
        growthAutonomyExpansion={{
          enabled: growthAutonomyFlags.growthAutonomyExpansionV1,
          panel: growthAutonomyFlags.growthAutonomyExpansionPanelV1,
        }}
        viewerIsAdmin={!!isAdmin}
        viewerGrowthAutonomyPilotAccess={viewerGrowthAutonomyPilotAccess}
        growthAutonomyEnforcementLayerFlag={growthPolicyEnforcementFlags.growthPolicyEnforcementV1}
        growthGovernanceFeedback={{
          enabled: growthGovernanceFeedbackFlags.growthGovernanceFeedbackV1,
          panel: growthGovernanceFeedbackFlags.growthGovernanceFeedbackPanelV1,
          bridge: growthGovernanceFeedbackFlags.growthGovernanceFeedbackBridgeV1,
        }}
        growthOperatingReviewPanel={growthOperatingReviewFlags.growthOperatingReviewPanelV1}
        growthRevenuePanelV1={engineFlags.growthRevenuePanelV1}
        revenueDashboardV1={revenueEnforcementFlags.revenueDashboardV1}
        growth1kPlanV1={engineFlags.growth1kPlanV1}
        growthDealExecutionPlanV1={engineFlags.dealExecutionPlanV1}
        growthAdsStarterPlanV1={engineFlags.adsStarterPlanV1}
        growthBrokerClosingV1={brokerClosingFlags.brokerClosingV1}
        growthBrokerSourcingV1={engineFlags.brokerSourcingV1}
        growthLandingPageV1={engineFlags.landingPageV1}
        growthClosingPlaybookV1={engineFlags.closingPlaybookV1}
        growthFastDealResultsLoggingV1={engineFlags.fastDealResultsV1}
        growthFastDealResultsPanelV1={engineFlags.fastDealResultsV1 && engineFlags.fastDealResultsPanelV1}
        growthFastDealCityComparisonPanelV1={
          engineFlags.fastDealCityComparisonV1 && engineFlags.fastDealCityComparisonPanelV1
        }
        growthCityPlaybookAdaptationPanelV1={
          engineFlags.cityPlaybookAdaptationV1 &&
          engineFlags.cityPlaybookAdaptationPanelV1 &&
          engineFlags.fastDealCityComparisonV1
        }
        growthLeadFollowupV1={engineFlags.leadFollowupV1}
        growthBrokerClosingAdvancedV1={engineFlags.brokerClosingAdvancedV1}
        growthScalingBlueprintV1={engineFlags.scalingBlueprintV1}
        growthBrokerAcquisitionV1={engineFlags.brokerAcquisitionV1}
        growthAdsEngineV1={engineFlags.adsEngineV1}
        growthFunnelSystemV1={engineFlags.funnelSystemV1}
        growthAiAssistExecutionV1={engineFlags.aiAssistExecutionV1}
        growthBrokerCompetitionV1={engineFlags.brokerCompetitionV1}
        growthScaleSystemV1={engineFlags.scaleSystemV1}
        growthExecutionResultsPanelV1={
          engineFlags.growthExecutionResultsV1 && engineFlags.growthExecutionResultsPanelV1
        }
        growthMarketExpansionPanelV1={
          engineFlags.marketExpansionV1 &&
          engineFlags.growthMarketExpansionPanelV1 &&
          engineFlags.fastDealCityComparisonV1
        }
        growthWeeklyReviewPanelV1={
          engineFlags.weeklyReviewV1 && engineFlags.growthWeeklyReviewPanelV1
        }
        growthCapitalAllocationPanelV1={
          engineFlags.capitalAllocationV1 && engineFlags.capitalAllocationPanelV1
        }
        growthAdaptiveIntelligencePanelV1={
          engineFlags.adaptiveIntelligenceV1 && engineFlags.adaptiveIntelligencePanelV1
        }
        growthExecutionPlannerPanelV1={
          engineFlags.executionPlannerV1 && engineFlags.executionPlannerPanelV1
        }
        growthTeamCoordinationPanelV1={
          engineFlags.teamCoordinationV1 && engineFlags.teamCoordinationPanelV1
        }
        growthExecutionAccountabilityPanelV1={
          engineFlags.executionAccountabilityV1 && engineFlags.executionAccountabilityPanelV1
        }
        growthExecutionAccountabilitySyncV1={engineFlags.executionAccountabilityV1}
        growthWeeklyTeamReviewPanelV1={
          engineFlags.weeklyTeamReviewV1 && engineFlags.weeklyTeamReviewPanelV1
        }
        growthRevenueForecastPanelV1={
          engineFlags.revenueForecastV1 && engineFlags.revenueForecastPanelV1
        }
        viewerUserId={userId}
        autonomousMarketplaceV1={engineFlags.autonomousMarketplaceV1}
        growthInvestorDashboardPanelV1={
          engineFlags.investorDashboardV1 && engineFlags.investorDashboardPanelV1
        }
        growthInvestorSharePanelV1={
          engineFlags.investorShareLinkV1 &&
          engineFlags.investorSharePanelV1 &&
          engineFlags.investorDashboardV1 &&
          engineFlags.investorDashboardPanelV1
        }
        investorPitchV1={engineFlags.investorPitchV1}
        cityDominationV1={engineFlags.cityDominationV1}
        scaleRoadmapV1={engineFlags.scaleRoadmapV1}
        fundraisingV1={engineFlags.fundraisingV1}
        moatEngineV1={engineFlags.moatEngineV1}
        dailyRoutineV1={engineFlags.dailyRoutineV1}
        pitchScriptV1={engineFlags.pitchScriptV1}
        cityDominationMtlV1={engineFlags.cityDominationMtlV1}
        dealClosingV1={engineFlags.dealClosingV1}
        compoundingV1={engineFlags.compoundingV1}
        conversationEngineV1={engineFlags.conversationEngineV1}
        antiGhostingV1={engineFlags.antiGhostingV1}
        closingPsychologyV1={engineFlags.closingPsychologyV1}
        timingOptimizerV1={engineFlags.timingOptimizerV1}
        brokerLockinV1={engineFlags.brokerLockinV1}
        growthPolicyV1={engineFlags.growthPolicyV1}
        growthScaleV1={engineFlags.growthScaleV1}
        growth100kV1={engineFlags.growth100kV1}
        growth1mV1={engineFlags.growth1mV1}
      />
    </div>
  );
}
