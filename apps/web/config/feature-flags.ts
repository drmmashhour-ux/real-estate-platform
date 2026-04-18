/**
 * Feature flags for multi-tenant rollout and gradual enablement.
 * Prefer env-backed flags in production.
 */
export const featureFlags = {
  /** Tenant-scoped data isolation enforced at the API layer */
  tenantIsolation: process.env.FEATURE_TENANT_ISOLATION === "true",
  /** Demo mode (staging / guided tours) */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  /**
   * Deal coordination hub — also check DB `featureFlag` keys:
   * document_request_autopilot_v1, bank_coordination_v1, notary_coordination_hub_v1,
   * request_communications_v1, closing_request_validation_v1
   * @see lib/deals/coordination-feature-flags.ts
   */
  documentRequestAutopilotV1: process.env.FEATURE_DOCUMENT_REQUEST_AUTOPILOT_V1 === "true",
  bankCoordinationV1: process.env.FEATURE_BANK_COORDINATION_V1 === "true",
  notaryCoordinationHubV1: process.env.FEATURE_NOTARY_COORDINATION_HUB_V1 === "true",
  requestCommunicationsV1: process.env.FEATURE_REQUEST_COMMUNICATIONS_V1 === "true",
  closingRequestValidationV1: process.env.FEATURE_CLOSING_REQUEST_VALIDATION_V1 === "true",
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

/**
 * LECIPM engine foundations (ranking, core autopilot, growth) — env-backed; default off in production unless set.
 * TODO v2: per-tenant overrides in DB; experiments / A-B testing integration.
 */
export const engineFlags = {
  rankingV1: process.env.FEATURE_RANKING_V1 === "true" || process.env.FEATURE_RANKING_V1 === "1",
  /** Alias: `ranking_v2` — weighted v2 blend (bounded featured, trust floors). Env: `FEATURE_RANKING_V2` */
  rankingV2: envTrue("FEATURE_RANKING_V2"),
  /** Alias: `recommendations_v1` — `/api/listings/recommendations`, listing detail rails. */
  recommendationsV1: envTrue("FEATURE_RECOMMENDATIONS_V1"),
  /** Alias: `conversion_optimization_v1` — truthful nudges + conversion analytics. */
  conversionOptimizationV1: envTrue("FEATURE_CONVERSION_OPTIMIZATION_V1"),
  /** LECIPM CRO Engine v1 — listing/checkout UX, funnel diagnostics, growth panel (no payment core changes). */
  croEngineV1: envTrue("FEATURE_CRO_ENGINE_V1"),
  /** Alias: `growth_loops_v1` — save/price-drop/re-engagement candidates (event-backed). */
  growthLoopsV1: envTrue("FEATURE_GROWTH_LOOPS_V1"),
  listingQualityV1: process.env.FEATURE_LISTING_QUALITY_V1 === "true" || process.env.FEATURE_LISTING_QUALITY_V1 === "1",
  listingAutopilotV1: process.env.FEATURE_LISTING_AUTOPILOT_V1 === "true" || process.env.FEATURE_LISTING_AUTOPILOT_V1 === "1",
  growthAutopilotV1: process.env.FEATURE_GROWTH_AUTOPILOT_V1 === "true" || process.env.FEATURE_GROWTH_AUTOPILOT_V1 === "1",
  seoCandidateGenerationV1:
    process.env.FEATURE_SEO_CANDIDATE_GENERATION_V1 === "true" || process.env.FEATURE_SEO_CANDIDATE_GENERATION_V1 === "1",
  reengagementCandidatesV1:
    process.env.FEATURE_REENGAGEMENT_CANDIDATES_V1 === "true" || process.env.FEATURE_REENGAGEMENT_CANDIDATES_V1 === "1",
  /** Growth Autopilot v2 — orchestrator, expanded SEO, campaigns, social candidates */
  growthV2: process.env.FEATURE_GROWTH_V2 === "true" || process.env.FEATURE_GROWTH_V2 === "1",
  seoPageGeneratorV2:
    process.env.FEATURE_SEO_PAGE_GENERATOR_V2 === "true" || process.env.FEATURE_SEO_PAGE_GENERATOR_V2 === "1",
  seoDraftGenerationV2:
    process.env.FEATURE_SEO_DRAFT_GENERATION_V2 === "true" || process.env.FEATURE_SEO_DRAFT_GENERATION_V2 === "1",
  referralEngineV2:
    process.env.FEATURE_REFERRAL_ENGINE_V2 === "true" || process.env.FEATURE_REFERRAL_ENGINE_V2 === "1",
  socialContentAutopilotV2:
    process.env.FEATURE_SOCIAL_CONTENT_AUTOPILOT_V2 === "true" || process.env.FEATURE_SOCIAL_CONTENT_AUTOPILOT_V2 === "1",
  campaignAutopilotV2:
    process.env.FEATURE_CAMPAIGN_AUTOPILOT_V2 === "true" || process.env.FEATURE_CAMPAIGN_AUTOPILOT_V2 === "1",
  /** Alias: `experiments_v1` — DB experiments + assignment/exposure APIs. */
  experimentsV1: process.env.FEATURE_EXPERIMENTS_V1 === "true" || process.env.FEATURE_EXPERIMENTS_V1 === "1",
  experimentRankingVariantsV1:
    process.env.FEATURE_EXPERIMENT_RANKING_VARIANTS_V1 === "true" ||
    process.env.FEATURE_EXPERIMENT_RANKING_VARIANTS_V1 === "1",
  experimentCampaignCopyV1:
    process.env.FEATURE_EXPERIMENT_CAMPAIGN_COPY_V1 === "true" ||
    process.env.FEATURE_EXPERIMENT_CAMPAIGN_COPY_V1 === "1",
  /** Trusted-publisher auto SEO (default off; drafts require review) */
  seoAutoPublishTrusted:
    process.env.FEATURE_SEO_AUTO_PUBLISH_TRUSTED === "true" || process.env.FEATURE_SEO_AUTO_PUBLISH_TRUSTED === "1",
  /** Tier 1 — watchlist + alerts (existing APIs; gate new candidate pipelines) */
  watchlistV1: envTrue("FEATURE_WATCHLIST_V1"),
  priceDropAlertsV1: envTrue("FEATURE_PRICE_DROP_ALERTS_V1"),
  /** Monetization: `FeaturedListing` audit + admin activate (FSBO updates `featuredUntil`) */
  featuredListingsV1: envTrue("FEATURE_FEATURED_LISTINGS_V1"),
  /** Billing surfaces (Stripe checkout wrappers, ledger-friendly flows) */
  billingV1: envTrue("FEATURE_BILLING_V1"),
  /** Host/seller subscription checkout (Pro/Growth) — incremental; may alias workspace billing */
  subscriptionsV1: envTrue("FEATURE_SUBSCRIPTIONS_V1"),
  /** Public trust badges / deal indicators (never raw fraud labels) */
  trustIndicatorsV1: envTrue("FEATURE_TRUST_INDICATORS_V1"),
  /** Conversion psychology / card badges — gated UI experiments */
  uxConversionV1: envTrue("FEATURE_UX_CONVERSION_V1"),
  /** Persist `FsboListingMetrics` snapshots (internal signals only) */
  listingMetricsV1: envTrue("FEATURE_LISTING_METRICS_V1"),
  /** Public host-acquisition lead capture + outreach logging */
  hostAcquisitionV1: envTrue("FEATURE_HOST_ACQUISITION_V1"),
  /** LECIPM Marketing Studio — Fabric canvas editor + saved projects (default off until enabled). */
  marketingStudioV1: envTrue("FEATURE_MARKETING_STUDIO_V1"),
  /** Marketing System v2 — user blog, distribution helpers, ROI reports (default off). */
  blogSystemV1: envTrue("FEATURE_BLOG_SYSTEM_V1"),
  distributionV1: envTrue("FEATURE_DISTRIBUTION_V1"),
  /** Optional outbound API connectors — default off; COPY/SHARE_LINKS do not need this. */
  distributionApiV1: envTrue("FEATURE_DISTRIBUTION_API_V1"),
  marketingIntelligenceV1: envTrue("FEATURE_MARKETING_INTELLIGENCE_V1"),
  /**
   * LECIPM Growth Machine v1 — unified dashboard, lead capture API, reporting (default off).
   * Does not auto-send outreach; suggestions are review-only unless existing pipelines send.
   */
  growthMachineV1: envTrue("FEATURE_GROWTH_MACHINE_V1"),
  /** Growth Machine revenue panel v1 — read-only RevenueEvent + lead aggregates (`/api/growth/revenue`). */
  growthRevenuePanelV1: envTrue("FEATURE_GROWTH_REVENUE_PANEL_V1"),
  /** $1K/month growth plan — daily tasks + target progress (`/api/growth/1k-plan`). */
  growth1kPlanV1: envTrue("FEATURE_GROWTH_1K_PLAN_V1"),
  /** Broker acquisition summary on Growth Machine (`/api/growth/broker-acquisition` + admin CRM link). */
  brokerAcquisitionV1: envTrue("FEATURE_BROKER_ACQUISITION_V1"),
  /** Draft-only ads copy + targeting for human export (no Meta/Google API). */
  adsEngineV1: envTrue("FEATURE_ADS_ENGINE_V1"),
  /** CRM lead → deal funnel summary + follow-up action hints (read-only / advisory). */
  funnelSystemV1: envTrue("FEATURE_FUNNEL_SYSTEM_V1"),
  /** 7-day operator deal sprint — day-by-day checklist (local progress; no auto-send). */
  dealExecutionPlanV1: envTrue("FEATURE_DEAL_EXECUTION_PLAN_V1"),
  /** $50 Facebook starter ads plan — copy + budget breakdown for human setup in Ads Manager (no Meta API). */
  adsStarterPlanV1: envTrue("FEATURE_ADS_STARTER_PLAN_V1"),
  /** Fast Deal V2 — manual broker sourcing playbook (no bots). */
  brokerSourcingV1: envTrue("FEATURE_BROKER_SOURCING_V1"),
  /** Fast Deal V2 — buyer lead-capture preview on Growth Machine (`POST /api/growth/early-leads`). */
  landingPageV1: envTrue("FEATURE_LANDING_PAGE_V1"),
  /** Fast Deal V2 — 48h human closing checklist. */
  closingPlaybookV1: envTrue("FEATURE_CLOSING_PLAYBOOK_V1"),
  /** Closing Engine V1 — lead follow-up copy cadence (manual send). */
  leadFollowupV1: envTrue("FEATURE_LEAD_FOLLOWUP_V1"),
  /** Closing Engine V1 — broker activation / urgency scripts (manual). */
  brokerClosingAdvancedV1: envTrue("FEATURE_BROKER_CLOSING_ADVANCED_V1"),
  /** Closing Engine V1 — 14-day scaling blueprint checklist (local progress). */
  scalingBlueprintV1: envTrue("FEATURE_SCALING_BLUEPRINT_V1"),
  /** Safe Scale Engine V2 — deterministic AI-assist suggestions (draft-only; governance-aware). */
  aiAssistExecutionV1: envTrue("FEATURE_AI_ASSIST_EXECUTION_V1"),
  /** Safe Scale Engine V2 — broker competition tiers from monetization signals (read-only). */
  brokerCompetitionV1: envTrue("FEATURE_BROKER_COMPETITION_V1"),
  /** Safe Scale Engine V2 — $100K/month planning panel + gaps. */
  scaleSystemV1: envTrue("FEATURE_SCALE_SYSTEM_V1"),
  /** Autonomous marketplace V1 — draft decisions + log-only approval (no spend/pricing writes). */
  autonomousMarketplaceV1: envTrue("FEATURE_AUTONOMOUS_MARKETPLACE_V1"),
  /** Gate + audit path for autonomous actions (policy + governance + compliance; default off). */
  controlledExecutionV1: envTrue("FEATURE_CONTROLLED_EXECUTION_V1"),
  /** Admin approval queue for gated actions (pairs with controlled execution). */
  autonomyApprovalsV1: envTrue("FEATURE_AUTONOMY_APPROVALS_V1"),
  /** Unified marketplace intelligence dashboard API (read-only aggregates). */
  marketplaceDashboardV1: envTrue("FEATURE_MARKETPLACE_DASHBOARD_V1"),
  /** Syria region read adapter — `syria_*` tables via shared `DATABASE_URL` (read-only; no merged Prisma schema). */
  syriaRegionAdapterV1: envTrue("FEATURE_SYRIA_REGION_ADAPTER_V1"),
  /** Stable `RegionListingRef` payloads in intelligence + previews (deterministic key format). */
  regionListingKeyV1: envTrue("FEATURE_REGION_LISTING_KEY_V1"),
  /** Syria listing preview via autonomous marketplace preview pipeline (DRY_RUN only). */
  syriaPreviewV1: envTrue("FEATURE_SYRIA_PREVIEW_V1"),
  /** Post-exec verification + rollback hooks for reversible internal actions only. */
  autopilotHardeningV1: envTrue("FEATURE_AUTOPILOT_HARDENING_V1"),
  /** Advisory domination / ranking–pricing surface (deterministic explainers). */
  marketDominationV1: envTrue("FEATURE_MARKET_DOMINATION_V1"),
  /** Investor pitch V1 — static narrative slides (review before external use). */
  investorPitchV1: envTrue("FEATURE_INVESTOR_PITCH_V1"),
  /** City domination V1 — 30-day human execution checklist. */
  cityDominationV1: envTrue("FEATURE_CITY_DOMINATION_V1"),
  /** Scale roadmap V1 — $0 → $10K → $100K → $1M milestones (advisory; local progress). */
  scaleRoadmapV1: envTrue("FEATURE_SCALE_ROADMAP_V1"),
  /** Fundraising V1 — investor narrative + advisory metrics (review before use). */
  fundraisingV1: envTrue("FEATURE_FUNDRAISING_V1"),
  /** Moat engine V1 — defensibility signals + recommendations (advisory). */
  moatEngineV1: envTrue("FEATURE_MOAT_ENGINE_V1"),
  /** Daily routine V1 — 14-day human execution checklist (~$10K push). */
  dailyRoutineV1: envTrue("FEATURE_DAILY_ROUTINE_V1"),
  /** Pitch script V1 — 60s + 5min investor scripts (copy-only). */
  pitchScriptV1: envTrue("FEATURE_PITCH_SCRIPT_V1"),
  /** Montréal 30-day domination checklist (human execution). */
  cityDominationMtlV1: envTrue("FEATURE_CITY_DOMINATION_MTL_V1"),
  /** Deal closing V1 — lead + broker copy-paste scripts (human send only). */
  dealClosingV1: envTrue("FEATURE_DEAL_CLOSING_V1"),
  /** Compounding V1 — post-deal habit checklist (1 → many deals; manual). */
  compoundingV1: envTrue("FEATURE_COMPOUNDING_V1"),
  /** Real conversation engine V1 — lead/broker scripts + deal flow viz (copy-only; no sends). */
  conversationEngineV1: envTrue("FEATURE_CONVERSATION_ENGINE_V1"),
  /** Anti-ghosting V1 — recovery message templates (manual send). */
  antiGhostingV1: envTrue("FEATURE_ANTI_GHOSTING_V1"),
  /** Closing psychology V1 — ethical nudge copy (human send). */
  closingPsychologyV1: envTrue("FEATURE_CLOSING_PSYCHOLOGY_V1"),
  /** Timing optimizer V1 — advisory SLA windows (no automation). */
  timingOptimizerV1: envTrue("FEATURE_TIMING_OPTIMIZER_V1"),
  /** Broker lock-in V1 — dependency signals + tier transparency (`/api/growth/broker-lockin`). */
  brokerLockinV1: envTrue("FEATURE_BROKER_LOCKIN_V1"),
  /** Growth Policy Enforcement Layer V1 — advisory evaluation (`GET /api/growth/policy`); does not block execution. */
  growthPolicyV1: envTrue("FEATURE_GROWTH_POLICY_V1"),
  /** $10K/month scale layer — forecast, pricing advisory, UTM ROI, broker performance (`/api/growth/scale`) + autopilot hints. */
  growthScaleV1: envTrue("FEATURE_GROWTH_SCALE_V1"),
  /** $100K/month orchestration — command center v7, marketplace/pricing/lifecycle fusion, top-3 autopilot hints. */
  growth100kV1: envTrue("FEATURE_GROWTH_100K_V1"),
  /** $1M/month global layer — command center v8, multi-market, finance/risk fusion, strategic autopilot hints. */
  growth1mV1: envTrue("FEATURE_GROWTH_1M_V1"),
  /** Growth Engine V4 — predictive budget, geo split, personalization (dashboard + suggestions only; default off). */
  growthEngineV4: envTrue("FEATURE_GROWTH_ENGINE_V4"),
  /**
   * LECIPM CRO + retargeting Phase 2 — persist learning signals & retargeting performance (additive; in-memory retained).
   * SQL low-conversion can be enabled independently via `croRetargetingLearningFlags.croSqlLowConversionV1`.
   */
  croRetargetingPersistenceV1: envTrue("FEATURE_CRO_RETARGETING_PERSISTENCE_V1"),
  croSqlLowConversionV1: envTrue("FEATURE_CRO_SQL_LOW_CONVERSION_V1"),
  /** Guided hub journey — stepper, progress, next-step cards (read-only guidance; default off). */
  hubJourneyV1: envTrue("FEATURE_HUB_JOURNEY_V1"),
  /** Hub copilot — 1–3 explainable suggestions from journey + signals (no auto-send / no auto-exec; default off). */
  hubCopilotV1: envTrue("FEATURE_HUB_COPILOT_V1"),
} as const;

/** Alias grouping for CRO / retargeting durable learning (reads same env keys as engineFlags). */
export const croRetargetingLearningFlags = {
  croRetargetingPersistenceV1: engineFlags.croRetargetingPersistenceV1,
  croSqlLowConversionV1: engineFlags.croSqlLowConversionV1,
} as const;

/**
 * CRO + retargeting durability V1 — explicit rollout (can enable alongside or instead of Phase 2 persistence flag).
 * Negative-signal quality is separate; see `negativeSignalQualityFlags`.
 */
export const croRetargetingDurabilityFlags = {
  croRetargetingDurabilityV1: envTrue("FEATURE_CRO_RETARGETING_DURABILITY_V1"),
} as const;

/** Conservative SQL / aggregate negative-signal layer (independent of durability persistence). */
export const negativeSignalQualityFlags = {
  negativeSignalQualityV1: envTrue("FEATURE_NEGATIVE_SIGNAL_QUALITY_V1"),
} as const;

/** Profit Engine V2 — persistence, confidence gating, trends (independent flags; default off). */
export const profitEngineFlags = {
  profitEnginePersistenceV1: envTrue("FEATURE_PROFIT_ENGINE_PERSISTENCE_V1"),
  profitEngineConfidenceV1: envTrue("FEATURE_PROFIT_ENGINE_CONFIDENCE_V1"),
  profitEngineTrendsV1: envTrue("FEATURE_PROFIT_ENGINE_TRENDS_V1"),
} as const;

/** Portfolio-level budget reallocation intelligence (recommendation-only; default off). */
export const portfolioOptimizationFlags = {
  portfolioOptimizationV1: envTrue("FEATURE_PORTFOLIO_OPTIMIZATION_V1"),
  portfolioOptimizationPersistenceV1: envTrue("FEATURE_PORTFOLIO_OPTIMIZATION_PERSISTENCE_V1"),
  portfolioOptimizationAlertsV1: envTrue("FEATURE_PORTFOLIO_OPTIMIZATION_ALERTS_V1"),
} as const;

/**
 * Marketplace Intelligence Engine V6 — quality/trust/fraud/pricing/ranking metadata (additive; default off).
 * Sub-flags allow partial operation (e.g. trust without fraud review).
 */
export const marketplaceIntelligenceFlags = {
  marketplaceIntelligenceV1: envTrue("FEATURE_MARKETPLACE_INTELLIGENCE_V1"),
  marketplaceTrustScoringV1: envTrue("FEATURE_MARKETPLACE_TRUST_SCORING_V1"),
  marketplaceFraudReviewV1: envTrue("FEATURE_MARKETPLACE_FRAUD_REVIEW_V1"),
  marketplaceRankingSignalsV1: envTrue("FEATURE_MARKETPLACE_RANKING_SIGNALS_V1"),
  marketplacePricingIntelligenceV1: envTrue("FEATURE_MARKETPLACE_PRICING_INTELLIGENCE_V1"),
} as const;

/**
 * Marketplace flywheel V1 — admin advisory insights (leads/brokers/listings ratios); no auto-spend or campaigns.
 */
export const marketplaceFlywheelFlags = {
  marketplaceFlywheelV1: envTrue("FEATURE_MARKETPLACE_FLYWHEEL_V1"),
} as const;

export type MarketplaceFlywheelFlagKey = keyof typeof marketplaceFlywheelFlags;

/** @see marketplaceFlywheelFlags.marketplaceFlywheelV1 */
export const FEATURE_MARKETPLACE_FLYWHEEL_V1 = marketplaceFlywheelFlags.marketplaceFlywheelV1;

/**
 * LECIPM Reputation + Ranking Engine v1 — additive to existing BNHub ranking / ListingRankingScore.
 * Roll out: admin/debug → host feedback → optional ranked API → public trust badges.
 */
export const reputationEngineFlags = {
  reputationEngineV1: envTrue("FEATURE_REPUTATION_ENGINE_V1"),
  rankingEngineV1: envTrue("FEATURE_RANKING_ENGINE_V1"),
  rankingDebugV1: envTrue("FEATURE_RANKING_DEBUG_V1"),
  publicTrustBadgesV1: envTrue("FEATURE_PUBLIC_TRUST_BADGES_V1"),
} as const;

/**
 * V8 shadow ranking evaluator — parallel score vs live after sort; default off; never changes production ordering.
 */
export const rankingV8ShadowFlags = {
  rankingV8ShadowEvaluatorV1: envTrue("FEATURE_RANKING_V8_SHADOW_EVALUATOR_V1"),
  rankingV8ShadowPersistenceV1: envTrue("FEATURE_RANKING_V8_SHADOW_PERSISTENCE_V1"),
  /** Phase C — bounded reorder on top of live sort after shadow comparison; default off. */
  rankingV8InfluenceV1: envTrue("FEATURE_RANKING_V8_INFLUENCE_V1"),
  /** Read-only rollout readiness scorecard; default off. */
  rankingV8ValidationScoringV1: envTrue("FEATURE_RANKING_V8_VALIDATION_SCORING_V1"),
  /** Optional persistence for scorecard snapshots — not wired to Prisma by default; default off. */
  rankingV8ValidationScoringPersistenceV1: envTrue("FEATURE_RANKING_V8_VALIDATION_SCORING_PERSISTENCE_V1"),
  /** Read-only admin governance dashboard (scorecard + advisory rollout); default off. */
  rankingV8GovernanceDashboardV1: envTrue("FEATURE_RANKING_V8_GOVERNANCE_DASHBOARD_V1"),
} as const;

/**
 * V8 payment safety — timeouts, retries, validation, audit/anomaly hooks around wrapped call sites (default off).
 * Does not replace webhooks or checkout; opt-in per route via `runV8SafePaymentOperation`.
 */
export const paymentsV8SafetyFlags = {
  paymentsV8SafetyV1: envTrue("FEATURE_PAYMENTS_V8_SAFETY_V1"),
} as const;

/** Soft launch + internal ads drafts + first-100 playbook — default off; no auto-spend. */
export const softLaunchFlags = {
  softLaunchV1: envTrue("FEATURE_SOFT_LAUNCH_V1"),
  adsEngineV1: envTrue("FEATURE_ADS_ENGINE_V1"),
  firstUsersV1: envTrue("FEATURE_FIRST_USERS_V1"),
} as const;

/** Meta/Google setup generators + conversion landings — no platform API keys; default off. */
export const landingConversionFlags = {
  facebookAdsV1: envTrue("FEATURE_FACEBOOK_ADS_V1"),
  googleAdsV1: envTrue("FEATURE_GOOGLE_ADS_V1"),
  landingPagesV1: envTrue("FEATURE_LANDING_PAGES_V1"),
} as const;

/**
 * Ads strategy + scale playbook UI (growth dashboard panels) — planning/export only; no API spend.
 * Default off; safe to enable for internal growth ops.
 */
export const adsStrategyFlags = {
  adsStrategyV1: envTrue("FEATURE_ADS_STRATEGY_V1"),
  scalePlanV1: envTrue("FEATURE_SCALE_PLAN_V1"),
  first100UsersPlanV1: envTrue("FEATURE_FIRST_100_USERS_PLAN_V1"),
} as const;

/**
 * LECIPM AI Ads — Autopilot + full automation loop (recommendation-only; default off).
 * Does not connect to Meta/Google APIs or change spend.
 */
export const adsAiAutomationFlags = {
  aiAdsAutopilotV1: envTrue("FEATURE_AI_ADS_AUTOPILOT_V1"),
  aiAdsAutomationLoopV1: envTrue("FEATURE_AI_ADS_AUTOMATION_LOOP_V1"),
  /** Persist loop runs + learning snapshots to Postgres (falls back to in-memory when off). */
  aiAdsAutomationPersistenceV1: envTrue("FEATURE_AI_ADS_AUTOMATION_PERSISTENCE_V1"),
  /** Show run history / trend preview on growth dashboard (no extra DB load when off). */
  aiAdsAutomationHistoryV1: envTrue("FEATURE_AI_ADS_AUTOMATION_HISTORY_V1"),
  /** Geo-aware hints from growth_events metadata (no fabricated regions). */
  aiAdsGeoLearningV1: envTrue("FEATURE_AI_ADS_GEO_LEARNING_V1"),
  /**
   * V8 shadow mode — run experimental ads autopilot proposal path in parallel with live; never replaces live output.
   * Requires `aiAdsAutomationLoopV1` for meaningful inputs; safe to enable in staging for diff analysis.
   */
  adsAutopilotShadowModeV1: envTrue("FEATURE_ADS_AUTOPILOT_SHADOW_MODE_V1"),
  /** Persist shadow vs live comparison rows (when shadow mode is on). */
  adsAutopilotShadowPersistenceV1: envTrue("FEATURE_ADS_AUTOPILOT_SHADOW_PERSISTENCE_V1"),
  /**
   * V8 rollout — when on, ads autopilot adapter may run shadow observation scheduling (still subject to
   * `adsAutopilotShadowModeV1`). When off, legacy path: proposals only, no shadow scheduling hook.
   * Default off — unset/false keeps historical behavior.
   */
  adsAutopilotV8RolloutV1: envTrue("FEATURE_ADS_AUTOPILOT_V8_ROLLOUT_V1"),
  /**
   * V8 controlled influence — bounded confidence/ranking nudges from shadow comparison (default off).
   * Requires rollout + shadow mode; never replaces `buildProposedActionsAdsAutomationLoop` as source of truth.
   */
  adsAutopilotV8InfluenceV1: envTrue("FEATURE_ADS_AUTOPILOT_V8_INFLUENCE_V1"),
  /**
   * V8 Phase D — when rollout + this flag are on, validated V8 primary output may be returned before legacy.
   * Legacy builder still runs for fallback and comparison; default off.
   */
  adsAutopilotV8PrimaryV1: envTrue("FEATURE_ADS_AUTOPILOT_V8_PRIMARY_V1"),
} as const;

/** LECIPM A/B testing — assignment + dashboard (default off). */
export const abTestingFlags = {
  abTestingV1: envTrue("FEATURE_AB_TESTING_V1"),
  abTestingAutonomousV1: envTrue("FEATURE_AB_TESTING_AUTONOMOUS_V1"),
} as const;

/**
 * V8 CRO optimization layer — funnel drop-off analysis, shadow recommendations, experiment hooks (default off).
 * Does not change live funnel behavior; gate any API/UI with these flags.
 */
export const croOptimizationV8Flags = {
  /** Master: enable `runCroV8OptimizationBundle` and admin CRO V8 API (read-only aggregates). */
  croV8AnalysisV1: envTrue("FEATURE_CRO_V8_ANALYSIS_V1"),
  /** Include shadow CRO recommendations in the bundle (requires analysis flag for coherent use). */
  croV8ShadowRecommendationsV1: envTrue("FEATURE_CRO_V8_SHADOW_RECS_V1"),
  /** Expose experiment readiness payload (no assignments; pair with AB testing when running real tests). */
  croV8ExperimentHooksV1: envTrue("FEATURE_CRO_V8_EXPERIMENT_HOOKS_V1"),
  /** Read-only shadow vs real funnel comparison + logging `[cro:v8:comparison]` (default off). */
  croV8FunnelComparisonV1: envTrue("FEATURE_CRO_V8_FUNNEL_COMPARISON_V1"),
} as const;

/**
 * LECIPM AI Autopilot System v1 — unified orchestrator (detect → recommend → gated execute).
 * Additive to existing BNHub / listing / deal autopilots. Default off.
 */
export const aiAutopilotV1Flags = {
  aiAutopilotV1: envTrue("FEATURE_AI_AUTOPILOT_V1"),
  safeActionsV1: envTrue("FEATURE_AI_AUTOPILOT_SAFE_ACTIONS_V1"),
  bnhubDomain: envTrue("FEATURE_AI_AUTOPILOT_BNHUB_V1"),
  growthDomain: envTrue("FEATURE_AI_AUTOPILOT_GROWTH_V1"),
  leadsDomain: envTrue("FEATURE_AI_AUTOPILOT_LEADS_V1"),
  dealsDomain: envTrue("FEATURE_AI_AUTOPILOT_DEALS_V1"),
  founderDomain: envTrue("FEATURE_AI_AUTOPILOT_FOUNDER_V1"),
} as const;

export type AiAutopilotV1FlagKey = keyof typeof aiAutopilotV1Flags;

/**
 * LECIPM Operator + Assistant Layer v1 — explainable recommendations, conflicts, guardrails, human approval (default off).
 * Guardrails default ON when the assistant layer is enabled unless `FEATURE_OPERATOR_GUARDRAILS_V1=false`.
 */
export const operatorLayerFlags = {
  aiAssistantLayerV1: envTrue("FEATURE_AI_ASSISTANT_LAYER_V1"),
  operatorApprovalsV1: envTrue("FEATURE_OPERATOR_APPROVALS_V1"),
  operatorConflictsV1: envTrue("FEATURE_OPERATOR_CONFLICTS_V1"),
  /** Explicitly set false to disable; when assistant layer is on, guardrails still apply unless disabled here. */
  operatorGuardrailsV1: envTrue("FEATURE_OPERATOR_GUARDRAILS_V1"),
} as const;

export type OperatorLayerFlagKey = keyof typeof operatorLayerFlags;

/** When assistant layer is enabled, guardrails apply unless explicitly turned off. */
export function isOperatorGuardrailsEffective(): boolean {
  if (process.env.FEATURE_OPERATOR_GUARDRAILS_V1 === "false" || process.env.FEATURE_OPERATOR_GUARDRAILS_V1 === "0") {
    return false;
  }
  if (operatorLayerFlags.aiAssistantLayerV1) return true;
  return operatorLayerFlags.operatorGuardrailsV1;
}

/**
 * LECIPM Platform Core v1 — unified decisions, tasks, audit, internal queue (default off).
 * Audit defaults on when platform core is enabled unless explicitly disabled.
 */
export const platformCoreFlags = {
  platformCoreV1: envTrue("FEATURE_PLATFORM_CORE_V1"),
  platformCoreExecutionV1: envTrue("FEATURE_PLATFORM_CORE_EXECUTION_V1"),
  platformCoreApprovalsV1: envTrue("FEATURE_PLATFORM_CORE_APPROVALS_V1"),
  platformCoreAuditV1: envTrue("FEATURE_PLATFORM_CORE_AUDIT_V1"),
  /** Ingest Ads Automation V4 loop outputs into Platform Core (decisions + audit); requires platformCoreV1. */
  platformCoreAdsIngestionV1: envTrue("FEATURE_PLATFORM_CORE_ADS_INGESTION_V1"),
  /** Platform Core V2 — priority scoring + persistence (additive). */
  platformCorePriorityV1: envTrue("FEATURE_PLATFORM_CORE_PRIORITY_V1"),
  /** Platform Core V2 — dependency graph + conflict marking (additive). */
  platformCoreDependenciesV1: envTrue("FEATURE_PLATFORM_CORE_DEPENDENCIES_V1"),
  /** Platform Core V2 — scheduled re-evaluation rows (additive). */
  platformCoreSchedulerV1: envTrue("FEATURE_PLATFORM_CORE_SCHEDULER_V1"),
  /** Platform Core V2 — heuristic simulation preview (additive). */
  platformCoreSimulationV1: envTrue("FEATURE_PLATFORM_CORE_SIMULATION_V1"),
} as const;

export type PlatformCoreFlagKey = keyof typeof platformCoreFlags;

/**
 * LECIPM PLATFORM — One Brain V2 adaptive learning (conservative; staged rollout).
 * When adaptive is off, One Brain V1 trust math applies (implicit weight 1.0).
 */
export const oneBrainV2Flags = {
  oneBrainV2AdaptiveV1: envTrue("FEATURE_ONE_BRAIN_V2_ADAPTIVE_V1"),
  oneBrainV2OutcomeIngestionV1: envTrue("FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1"),
  /** Capped ranking influence — keep off in production until staging validates. */
  oneBrainV2RankingWeightingV1: envTrue("FEATURE_ONE_BRAIN_V2_RANKING_WEIGHTING_V1"),
} as const;

export type OneBrainV2FlagKey = keyof typeof oneBrainV2Flags;

/**
 * One Brain V3 — cross-domain propagation, negative-signal quality gate, durability (additive; default off).
 */
export const oneBrainV3Flags = {
  oneBrainV3CrossDomainV1: envTrue("FEATURE_ONE_BRAIN_V3_CROSS_DOMAIN_V1"),
  oneBrainV3NegativeFilterV1: envTrue("FEATURE_ONE_BRAIN_V3_NEGATIVE_FILTER_V1"),
  oneBrainV3DurabilityV1: envTrue("FEATURE_ONE_BRAIN_V3_DURABILITY_V1"),
} as const;

export type OneBrainV3FlagKey = keyof typeof oneBrainV3Flags;

/**
 * One Brain V8 — shadow observation / parallel evaluators (read-only vs stored outcomes; default off).
 * Does not replace V2/V3 learning; additive analysis and audit only.
 */
export const oneBrainV8Flags = {
  /** Run shadow scoring pass over recent outcomes (read-only; no writes to outcome rows). */
  brainV8ShadowObservationV1: envTrue("FEATURE_BRAIN_V8_SHADOW_OBSERVATION_V1"),
  /** Persist shadow observation summaries to `brain_shadow_observations` when audit-capable DB is available. */
  brainV8ShadowPersistenceV1: envTrue("FEATURE_BRAIN_V8_SHADOW_PERSISTENCE_V1"),
  /**
   * Phase C — bounded presentation influence on Brain snapshot (ordering/tags/notes only; default off).
   * Does not alter stored weights, outcomes, or learning.
   */
  brainV8InfluenceV1: envTrue("FEATURE_BRAIN_V8_INFLUENCE_V1"),
  /**
   * Phase D — V8-first presentation path (validated; falls back to Phase C overlay). Default off.
   * Does not change stored weights/outcomes; rollback via env.
   */
  brainV8PrimaryV1: envTrue("FEATURE_BRAIN_V8_PRIMARY_V1"),
} as const;

export type OneBrainV8FlagKey = keyof typeof oneBrainV8Flags;

/**
 * LECIPM V7 — Autonomous Growth System (staged rollout: observe → simulate → safe execution → reevaluation).
 */
export const autonomousGrowthFlags = {
  /** Base layer: unified observation + run records + dashboard (default off). */
  autonomousGrowthSystemV1: envTrue("FEATURE_AUTONOMOUS_GROWTH_SYSTEM_V1"),
  /** Safe low-risk execution path only — requires explicit enablement even in staging. */
  autonomousGrowthExecutionV1: envTrue("FEATURE_AUTONOMOUS_GROWTH_EXECUTION_V1"),
  /** Heuristic simulation summaries (Operator + Platform Core previews). */
  autonomousGrowthSimulationV1: envTrue("FEATURE_AUTONOMOUS_GROWTH_SIMULATION_V1"),
  /** Scheduled reevaluation + delayed learning hooks. */
  autonomousGrowthReevaluationV1: envTrue("FEATURE_AUTONOMOUS_GROWTH_REEVALUATION_V1"),
} as const;

export type AutonomousGrowthFlagKey = keyof typeof autonomousGrowthFlags;

/**
 * AI Growth Autopilot SAFE MODE — advisory queue on top of unified snapshot; human approval; simulated execution only (default off).
 */
export const aiGrowthAutopilotSafeFlags = {
  aiAutopilotV1: envTrue("FEATURE_AI_AUTOPILOT_V1"),
  aiAutopilotExecutionV1: envTrue("FEATURE_AI_AUTOPILOT_EXECUTION_V1"),
  /** Rollback UI + API for reversible controlled executions only (default off). */
  aiAutopilotRollbackV1: envTrue("FEATURE_AI_AUTOPILOT_ROLLBACK_V1"),
} as const;

export type AiGrowthAutopilotSafeFlagKey = keyof typeof aiGrowthAutopilotSafeFlags;

/**
 * AI Autopilot — leads domain only (score/tag/priority on `Lead` ai* columns; no outbound comms; default off).
 */
export const aiAutopilotLeadsExecutionFlags = {
  leadsExecutionV1: envTrue("FEATURE_AI_AUTOPILOT_LEADS_EXECUTION_V1"),
  leadsTaggingV1: envTrue("FEATURE_AI_AUTOPILOT_LEADS_TAGGING_V1"),
  leadsScoringV1: envTrue("FEATURE_AI_AUTOPILOT_LEADS_SCORING_V1"),
} as const;

export type AiAutopilotLeadsExecutionFlagKey = keyof typeof aiAutopilotLeadsExecutionFlags;

/**
 * AI Autopilot — messaging assist (draft-only; admin copy; never auto-send; default off).
 */
export const aiAutopilotMessagingAssistFlags = {
  messagingAssistV1: envTrue("FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1"),
  /** When on, use tone-selection helpers (friendly / professional / short); when off, drafts use professional tone only. */
  messagingTemplatesV1: envTrue("FEATURE_AI_AUTOPILOT_MESSAGING_TEMPLATES_V1"),
} as const;

export type AiAutopilotMessagingAssistFlagKey = keyof typeof aiAutopilotMessagingAssistFlags;

/**
 * AI Response Desk — internal draft review queue (admin CRM; no send; default off).
 */
export const aiResponseDeskFlags = {
  aiResponseDeskV1: envTrue("FEATURE_AI_RESPONSE_DESK_V1"),
  aiResponseDeskReviewStateV1: envTrue("FEATURE_AI_RESPONSE_DESK_REVIEW_STATE_V1"),
} as const;

export type AiResponseDeskFlagKey = keyof typeof aiResponseDeskFlags;

/**
 * AI Autopilot — internal follow-up queue (metadata only; no outbound messaging; default off).
 */
export const aiAutopilotFollowupFlags = {
  followupV1: envTrue("FEATURE_AI_AUTOPILOT_FOLLOWUP_V1"),
  /** Expose sorted queue in admin CRM views. */
  followupQueueV1: envTrue("FEATURE_AI_AUTOPILOT_FOLLOWUP_QUEUE_V1"),
  /** Set nextActionAt / reminderReason on internal follow-up snapshots. */
  followupRemindersV1: envTrue("FEATURE_AI_AUTOPILOT_FOLLOWUP_REMINDERS_V1"),
} as const;

export type AiAutopilotFollowupFlagKey = keyof typeof aiAutopilotFollowupFlags;

/**
 * AI Autopilot — content draft assist (ad / listing / outreach copy; draft-only; never auto-publish; default off).
 */
export const aiAutopilotContentAssistFlags = {
  contentAssistV1: envTrue("FEATURE_AI_AUTOPILOT_CONTENT_ASSIST_V1"),
  adCopyV1: envTrue("FEATURE_AI_AUTOPILOT_AD_COPY_V1"),
  listingCopyV1: envTrue("FEATURE_AI_AUTOPILOT_LISTING_COPY_V1"),
  outreachCopyV1: envTrue("FEATURE_AI_AUTOPILOT_OUTREACH_COPY_V1"),
} as const;

export type AiAutopilotContentAssistFlagKey = keyof typeof aiAutopilotContentAssistFlags;

/**
 * AI Autopilot — controlled influence (CRO + ads strategy suggestions only; default off; never auto-executes).
 */
export const aiAutopilotInfluenceFlags = {
  influenceV1: envTrue("FEATURE_AI_AUTOPILOT_INFLUENCE_V1"),
} as const;

export type AiAutopilotInfluenceFlagKey = keyof typeof aiAutopilotInfluenceFlags;

/**
 * Growth Fusion V1 — unified read-only intelligence across leads, ads, CRO, content, autopilot (default off).
 * Bridges are separate gates; no execution or external I/O in the core path.
 */
export const growthFusionFlags = {
  growthFusionV1: envTrue("FEATURE_GROWTH_FUSION_V1"),
  growthFusionAutopilotBridgeV1: envTrue("FEATURE_GROWTH_FUSION_AUTOPILOT_BRIDGE_V1"),
  growthFusionContentBridgeV1: envTrue("FEATURE_GROWTH_FUSION_CONTENT_BRIDGE_V1"),
  growthFusionInfluenceBridgeV1: envTrue("FEATURE_GROWTH_FUSION_INFLUENCE_BRIDGE_V1"),
} as const;

export type GrowthFusionFlagKey = keyof typeof growthFusionFlags;

/**
 * Growth Governance V1 — advisory prioritization / freeze hints / escalation (default off).
 * Does not mutate execution, flags, or payments.
 */
export const growthGovernanceFlags = {
  growthGovernanceV1: envTrue("FEATURE_GROWTH_GOVERNANCE_V1"),
  growthGovernanceEscalationV1: envTrue("FEATURE_GROWTH_GOVERNANCE_ESCALATION_V1"),
  growthGovernanceMonitoringV1: envTrue("FEATURE_GROWTH_GOVERNANCE_MONITORING_V1"),
} as const;

export type GrowthGovernanceFlagKey = keyof typeof growthGovernanceFlags;

/**
 * Growth governance policy console — centralized read-only policy snapshot (default off; advisory in v1).
 */
export const growthGovernancePolicyFlags = {
  growthGovernancePolicyV1: envTrue("FEATURE_GROWTH_GOVERNANCE_POLICY_V1"),
  growthGovernanceConsolePanelV1: envTrue("FEATURE_GROWTH_GOVERNANCE_CONSOLE_PANEL_V1"),
} as const;

/** Env aliases — same as `growthGovernancePolicyFlags.*` (default off). */
export const FEATURE_GROWTH_GOVERNANCE_POLICY_V1 = growthGovernancePolicyFlags.growthGovernancePolicyV1;
export const FEATURE_GROWTH_GOVERNANCE_CONSOLE_PANEL_V1 = growthGovernancePolicyFlags.growthGovernanceConsolePanelV1;

export type GrowthGovernancePolicyFlagKey = keyof typeof growthGovernancePolicyFlags;

/**
 * Bounded policy enforcement for non-critical advisory flows only (default off).
 * Does not gate payments, bookings, ads execution core, or CRO core.
 */
export const growthPolicyEnforcementFlags = {
  growthPolicyEnforcementV1: envTrue("FEATURE_GROWTH_POLICY_ENFORCEMENT_V1"),
  growthPolicyEnforcementPanelV1: envTrue("FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1"),
} as const;

export type GrowthPolicyEnforcementFlagKey = keyof typeof growthPolicyEnforcementFlags;

export const FEATURE_GROWTH_POLICY_ENFORCEMENT_V1 = growthPolicyEnforcementFlags.growthPolicyEnforcementV1;
export const FEATURE_GROWTH_POLICY_ENFORCEMENT_PANEL_V1 = growthPolicyEnforcementFlags.growthPolicyEnforcementPanelV1;

/**
 * Governance memory + enforcement feedback — advisory patterns & review hints only (default off).
 * Does not relax policy, unfreeze, or change execution.
 */
export const growthGovernanceFeedbackFlags = {
  growthGovernanceFeedbackV1: envTrue("FEATURE_GROWTH_GOVERNANCE_FEEDBACK_V1"),
  growthGovernanceFeedbackPanelV1: envTrue("FEATURE_GROWTH_GOVERNANCE_FEEDBACK_PANEL_V1"),
  growthGovernanceFeedbackBridgeV1: envTrue("FEATURE_GROWTH_GOVERNANCE_FEEDBACK_BRIDGE_V1"),
} as const;

export type GrowthGovernanceFeedbackFlagKey = keyof typeof growthGovernanceFeedbackFlags;

/**
 * Growth Executive Panel V1 — single company-level read-only snapshot (default off).
 */
export const growthExecutiveFlags = {
  growthExecutivePanelV1: envTrue("FEATURE_GROWTH_EXECUTIVE_PANEL_V1"),
} as const;

export type GrowthExecutiveFlagKey = keyof typeof growthExecutiveFlags;

/**
 * Daily Growth Brief V1 — yesterday rollup + today priorities (read-only; default off).
 */
export const growthDailyBriefFlags = {
  growthDailyBriefV1: envTrue("FEATURE_GROWTH_DAILY_BRIEF_V1"),
} as const;

export type GrowthDailyBriefFlagKey = keyof typeof growthDailyBriefFlags;

/**
 * Growth auto-learning V1 — local outcome linkage + optional in-memory weight nudges (default off).
 */
export const growthLearningFlags = {
  growthLearningV1: envTrue("FEATURE_GROWTH_LEARNING_V1"),
  growthLearningAdaptiveWeightsV1: envTrue("FEATURE_GROWTH_LEARNING_ADAPTIVE_WEIGHTS_V1"),
  growthLearningMonitoringV1: envTrue("FEATURE_GROWTH_LEARNING_MONITORING_V1"),
} as const;

export type GrowthLearningFlagKey = keyof typeof growthLearningFlags;

/**
 * Multi-agent growth coordination — proposals, conflicts, alignments (default off; advisory only).
 */
export const growthMultiAgentFlags = {
  growthMultiAgentV1: envTrue("FEATURE_GROWTH_MULTI_AGENT_V1"),
  growthAgentConflictV1: envTrue("FEATURE_GROWTH_AGENT_CONFLICT_V1"),
  growthAgentAlignmentV1: envTrue("FEATURE_GROWTH_AGENT_ALIGNMENT_V1"),
} as const;

export type GrowthMultiAgentFlagKey = keyof typeof growthMultiAgentFlags;

/**
 * Growth strategy layer — weekly priorities, experiments, roadmap (advisory only; default off).
 */
export const growthStrategyFlags = {
  growthStrategyV1: envTrue("FEATURE_GROWTH_STRATEGY_V1"),
  growthStrategyExperimentsV1: envTrue("FEATURE_GROWTH_STRATEGY_EXPERIMENTS_V1"),
  growthStrategyRoadmapV1: envTrue("FEATURE_GROWTH_STRATEGY_ROADMAP_V1"),
} as const;

export type GrowthStrategyFlagKey = keyof typeof growthStrategyFlags;

/**
 * Growth operating cadence — daily + weekly rhythm (advisory only; default off).
 */
export const growthCadenceFlags = {
  growthCadenceV1: envTrue("FEATURE_GROWTH_CADENCE_V1"),
} as const;

export type GrowthCadenceFlagKey = keyof typeof growthCadenceFlags;

/**
 * Growth simulations — what-if estimates for planning (advisory only; default off).
 */
export const growthSimulationFlags = {
  growthSimulationV1: envTrue("FEATURE_GROWTH_SIMULATION_V1"),
  growthSimulationScenariosV1: envTrue("FEATURE_GROWTH_SIMULATION_SCENARIOS_V1"),
  growthSimulationPanelV1: envTrue("FEATURE_GROWTH_SIMULATION_PANEL_V1"),
} as const;

export type GrowthSimulationFlagKey = keyof typeof growthSimulationFlags;

/**
 * Growth Mission Control — single advisory console aggregating executive, brief, governance, strategy, agents, simulations (default off).
 */
export const growthMissionControlFlags = {
  growthMissionControlV1: envTrue("FEATURE_GROWTH_MISSION_CONTROL_V1"),
  growthMissionControlPanelV1: envTrue("FEATURE_GROWTH_MISSION_CONTROL_PANEL_V1"),
} as const;

export type GrowthMissionControlFlagKey = keyof typeof growthMissionControlFlags;

/**
 * Platform structure improvement pass — advisory clarity / monetization / trust / ops / data reviews (default off).
 */
export const platformImprovementFlags = {
  platformImprovementReviewV1: envTrue("FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1"),
} as const;

export type PlatformImprovementFlagKey = keyof typeof platformImprovementFlags;

/** @see platformImprovementFlags.platformImprovementReviewV1 */
export const FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1 = platformImprovementFlags.platformImprovementReviewV1;

/**
 * Lead monetization V1 — preview/partial vs full unlock, Stripe checkout reuse (additive; default off).
 */
export const leadMonetizationFlags = {
  leadMonetizationV1: envTrue("FEATURE_LEAD_MONETIZATION_V1"),
} as const;

export type LeadMonetizationFlagKey = keyof typeof leadMonetizationFlags;

/** @see leadMonetizationFlags.leadMonetizationV1 */
export const FEATURE_LEAD_MONETIZATION_V1 = leadMonetizationFlags.leadMonetizationV1;

/**
 * Lead quality scoring + advisory pricing V1 — deterministic breakdown; does not override Stripe unlock price.
 */
export const leadQualityFlags = {
  leadQualityV1: envTrue("FEATURE_LEAD_QUALITY_V1"),
} as const;

export type LeadQualityFlagKey = keyof typeof leadQualityFlags;

/** @see leadQualityFlags.leadQualityV1 */
export const FEATURE_LEAD_QUALITY_V1 = leadQualityFlags.leadQualityV1;

/**
 * Dynamic lead pricing V1 — advisory multipliers on revenue-engine base price; display-only (no Stripe/checkout override).
 */
export const dynamicPricingFlags = {
  dynamicPricingV1: envTrue("FEATURE_DYNAMIC_PRICING_V1"),
} as const;

export type DynamicPricingFlagKey = keyof typeof dynamicPricingFlags;

/** @see dynamicPricingFlags.dynamicPricingV1 */
export const FEATURE_DYNAMIC_PRICING_V1 = dynamicPricingFlags.dynamicPricingV1;

/**
 * Lead monetization control layer — unified admin readout (quality + demand + dynamic + base); advisory only.
 */
export const leadMonetizationControlFlags = {
  monetizationControlV1: envTrue("FEATURE_LEAD_MONETIZATION_CONTROL_V1"),
} as const;

export type LeadMonetizationControlFlagKey = keyof typeof leadMonetizationControlFlags;

/** @see leadMonetizationControlFlags.monetizationControlV1 */
export const FEATURE_LEAD_MONETIZATION_CONTROL_V1 =
  leadMonetizationControlFlags.monetizationControlV1;

/**
 * Broker closing V1 — pipeline stages, follow-up suggestions, deal summary (additive; default off).
 */
export const brokerClosingFlags = {
  brokerClosingV1: envTrue("FEATURE_BROKER_CLOSING_V1"),
} as const;

export type BrokerClosingFlagKey = keyof typeof brokerClosingFlags;

/** @see brokerClosingFlags.brokerClosingV1 */
export const FEATURE_BROKER_CLOSING_V1 = brokerClosingFlags.brokerClosingV1;

/**
 * Broker performance scoring V1 — advisory CRM + billing signals (default off).
 */
export const brokerPerformanceFlags = {
  brokerPerformanceV1: envTrue("FEATURE_BROKER_PERFORMANCE_V1"),
} as const;

export type BrokerPerformanceFlagKey = keyof typeof brokerPerformanceFlags;

/** @see brokerPerformanceFlags.brokerPerformanceV1 */
export const FEATURE_BROKER_PERFORMANCE_V1 = brokerPerformanceFlags.brokerPerformanceV1;

/**
 * Broker marketplace ranking V1 — internal/admin visibility only (default off).
 */
export const brokerMarketplaceRankingFlags = {
  brokerMarketplaceRankingV1: envTrue("FEATURE_BROKER_MARKETPLACE_RANKING_V1"),
} as const;

export type BrokerMarketplaceRankingFlagKey = keyof typeof brokerMarketplaceRankingFlags;

/** @see brokerMarketplaceRankingFlags.brokerMarketplaceRankingV1 */
export const FEATURE_BROKER_MARKETPLACE_RANKING_V1 = brokerMarketplaceRankingFlags.brokerMarketplaceRankingV1;

/**
 * Smart lead routing V1 — advisory candidate ranking only (no auto-assignment; default off).
 */
export const brokerRoutingFlags = {
  brokerRoutingV1: envTrue("FEATURE_BROKER_ROUTING_V1"),
  brokerRoutingPanelV1: envTrue("FEATURE_BROKER_ROUTING_PANEL_V1"),
} as const;

export type BrokerRoutingFlagKey = keyof typeof brokerRoutingFlags;

/** @see brokerRoutingFlags.brokerRoutingV1 */
export const FEATURE_BROKER_ROUTING_V1 = brokerRoutingFlags.brokerRoutingV1;
/** @see brokerRoutingFlags.brokerRoutingPanelV1 */
export const FEATURE_BROKER_ROUTING_PANEL_V1 = brokerRoutingFlags.brokerRoutingPanelV1;

/**
 * Smart lead routing V2 — decision + optional gated auto-assign on top of V1 (default off; never silent without policy).
 */
export const smartRoutingV2Flags = {
  smartRoutingV2: envTrue("FEATURE_SMART_ROUTING_V2"),
  smartRoutingAutoAssign: envTrue("FEATURE_SMART_ROUTING_AUTO_ASSIGN"),
} as const;

export type SmartRoutingV2FlagKey = keyof typeof smartRoutingV2Flags;

/** @see smartRoutingV2Flags.smartRoutingV2 */
export const FEATURE_SMART_ROUTING_V2 = smartRoutingV2Flags.smartRoutingV2;
/** @see smartRoutingV2Flags.smartRoutingAutoAssign */
export const FEATURE_SMART_ROUTING_AUTO_ASSIGN = smartRoutingV2Flags.smartRoutingAutoAssign;

/**
 * Growth Operating Review — weekly what-worked / challenges / next-week synthesis (read-only; default off).
 */
export const growthOperatingReviewFlags = {
  growthOperatingReviewV1: envTrue("FEATURE_GROWTH_OPERATING_REVIEW_V1"),
  growthOperatingReviewPanelV1: envTrue("FEATURE_GROWTH_OPERATING_REVIEW_PANEL_V1"),
} as const;

export type GrowthOperatingReviewFlagKey = keyof typeof growthOperatingReviewFlags;

/**
 * Growth Memory — bounded advisory recall from growth signals (default off; no DB persistence in v1).
 */
export const growthMemoryFlags = {
  growthMemoryV1: envTrue("FEATURE_GROWTH_MEMORY_V1"),
  growthMemoryPriorityBridgeV1: envTrue("FEATURE_GROWTH_MEMORY_PRIORITY_BRIDGE_V1"),
  growthMemoryPanelV1: envTrue("FEATURE_GROWTH_MEMORY_PANEL_V1"),
} as const;

export type GrowthMemoryFlagKey = keyof typeof growthMemoryFlags;

/**
 * Growth Knowledge Graph — advisory relationship map over growth signals (default off; no DB in v1).
 */
export const growthKnowledgeGraphFlags = {
  growthKnowledgeGraphV1: envTrue("FEATURE_GROWTH_KNOWLEDGE_GRAPH_V1"),
  growthKnowledgeGraphPanelV1: envTrue("FEATURE_GROWTH_KNOWLEDGE_GRAPH_PANEL_V1"),
  growthKnowledgeGraphBridgeV1: envTrue("FEATURE_GROWTH_KNOWLEDGE_GRAPH_BRIDGE_V1"),
} as const;

/** Env aliases — same as `growthKnowledgeGraphFlags.*` (default off). */
export const FEATURE_GROWTH_KNOWLEDGE_GRAPH_V1 = growthKnowledgeGraphFlags.growthKnowledgeGraphV1;
export const FEATURE_GROWTH_KNOWLEDGE_GRAPH_PANEL_V1 = growthKnowledgeGraphFlags.growthKnowledgeGraphPanelV1;
export const FEATURE_GROWTH_KNOWLEDGE_GRAPH_BRIDGE_V1 = growthKnowledgeGraphFlags.growthKnowledgeGraphBridgeV1;

export type GrowthKnowledgeGraphFlagKey = keyof typeof growthKnowledgeGraphFlags;

/**
 * Growth Decision Journal — advisory record of recommendations vs human posture vs snapshot outcomes (default off; no DB in v1).
 */
export const growthDecisionJournalFlags = {
  growthDecisionJournalV1: envTrue("FEATURE_GROWTH_DECISION_JOURNAL_V1"),
  growthDecisionJournalPanelV1: envTrue("FEATURE_GROWTH_DECISION_JOURNAL_PANEL_V1"),
  growthDecisionJournalBridgeV1: envTrue("FEATURE_GROWTH_DECISION_JOURNAL_BRIDGE_V1"),
} as const;

export const FEATURE_GROWTH_DECISION_JOURNAL_V1 = growthDecisionJournalFlags.growthDecisionJournalV1;
export const FEATURE_GROWTH_DECISION_JOURNAL_PANEL_V1 = growthDecisionJournalFlags.growthDecisionJournalPanelV1;
export const FEATURE_GROWTH_DECISION_JOURNAL_BRIDGE_V1 = growthDecisionJournalFlags.growthDecisionJournalBridgeV1;

export type GrowthDecisionJournalFlagKey = keyof typeof growthDecisionJournalFlags;

/**
 * Autonomous AI Company Mode — top-level strategy/opportunity/execution orchestration (default off; advisory).
 * Mode tier via `AUTONOMOUS_COMPANY_MODE` or `AUTONOMOUS_MODE` (off | shadow | assist | safe_autopilot).
 * Kill switch: `FEATURE_AUTONOMOUS_COMPANY_KILL_SWITCH` or `AUTONOMOUS_COMPANY_DISABLED`.
 */
export type AutonomousCompanyModeTier = "off" | "shadow" | "assist" | "safe_autopilot";

export function isAutonomousCompanyKillSwitch(): boolean {
  return (
    process.env.FEATURE_AUTONOMOUS_COMPANY_KILL_SWITCH === "1" ||
    process.env.FEATURE_AUTONOMOUS_COMPANY_KILL_SWITCH === "true" ||
    process.env.AUTONOMOUS_COMPANY_DISABLED === "1" ||
    process.env.AUTONOMOUS_COMPANY_DISABLED === "true"
  );
}

export function getAutonomousCompanyModeTier(): AutonomousCompanyModeTier {
  if (isAutonomousCompanyKillSwitch()) return "off";
  const raw = (process.env.AUTONOMOUS_COMPANY_MODE ?? process.env.AUTONOMOUS_MODE ?? "off").toLowerCase().trim();
  if (raw === "off" || raw === "" || raw === "0" || raw === "false") return "off";
  if (raw === "shadow") return "shadow";
  if (raw === "assist") return "assist";
  if (raw === "safe_autopilot" || raw === "safe-autopilot") return "safe_autopilot";
  if (raw === "full_autopilot" || raw === "full") return "safe_autopilot";
  return "off";
}

export const autonomousCompanyFlags = {
  autonomousCompanyModeV1: envTrue("FEATURE_AUTONOMOUS_COMPANY_MODE_V1"),
  autonomousStrategyV1: envTrue("FEATURE_AUTONOMOUS_STRATEGY_V1"),
  autonomousExecutionV1: envTrue("FEATURE_AUTONOMOUS_EXECUTION_V1"),
  autonomousContentV1: envTrue("FEATURE_AUTONOMOUS_CONTENT_V1"),
} as const;

export type AutonomousCompanyFlagKey = keyof typeof autonomousCompanyFlags;

/**
 * Multi-agent swarm layer — specialized agents under one orchestrator (default off; advisory only).
 */
export const swarmSystemFlags = {
  swarmSystemV1: envTrue("FEATURE_SWARM_SYSTEM_V1"),
  swarmAgentNegotiationV1: envTrue("FEATURE_SWARM_AGENT_NEGOTIATION_V1"),
  swarmAgentPersistenceV1: envTrue("FEATURE_SWARM_AGENT_PERSISTENCE_V1"),
  swarmAgentInfluenceV1: envTrue("FEATURE_SWARM_AGENT_INFLUENCE_V1"),
  swarmAgentPrimaryV1: envTrue("FEATURE_SWARM_AGENT_PRIMARY_V1"),
} as const;

export type SwarmSystemFlagKey = keyof typeof swarmSystemFlags;

/** Swarm compute + agent fan-out when master flag is on. */
export function isSwarmOrchestrationActive(): boolean {
  return swarmSystemFlags.swarmSystemV1;
}

/**
 * Fusion System V1 — cross-domain advisory orchestration (read-only; additive).
 * Requires `fusionSystemV1` + `fusionSystemShadowV1` for normalization/aggregation compute.
 * Persistence and influence are separate gates (optional writes / future presentation only).
 */
export const fusionSystemFlags = {
  fusionSystemV1: envTrue("FEATURE_FUSION_SYSTEM_V1"),
  fusionSystemShadowV1: envTrue("FEATURE_FUSION_SYSTEM_SHADOW_V1"),
  fusionSystemPersistenceV1: envTrue("FEATURE_FUSION_SYSTEM_PERSISTENCE_V1"),
  fusionSystemInfluenceV1: envTrue("FEATURE_FUSION_SYSTEM_INFLUENCE_V1"),
  /** Phase C — Fusion as primary advisory composition surface (presentation only; default off). */
  fusionSystemPrimaryV1: envTrue("FEATURE_FUSION_SYSTEM_PRIMARY_V1"),
} as const;

export type FusionSystemFlagKey = keyof typeof fusionSystemFlags;

/** Read-only fusion pipeline (normalization + scoring + advisory) when both base flags are on. */
export function isFusionOrchestrationActive(): boolean {
  return fusionSystemFlags.fusionSystemV1 && fusionSystemFlags.fusionSystemShadowV1;
}

/**
 * Global Fusion V1 — read-only cross-system advisory (Brain + Ads + CRO + Ranking) via control-center aggregate.
 * Additive to Fusion System V1; does not replace source engines. Defaults off.
 */
export const globalFusionFlags = {
  globalFusionV1: envTrue("FEATURE_GLOBAL_FUSION_V1"),
  globalFusionPersistenceV1: envTrue("FEATURE_GLOBAL_FUSION_PERSISTENCE_V1"),
  globalFusionInfluenceV1: envTrue("FEATURE_GLOBAL_FUSION_INFLUENCE_V1"),
  /** Phase C: Global Fusion as primary cross-system advisory composition surface (read-only; default off). */
  globalFusionPrimaryV1: envTrue("FEATURE_GLOBAL_FUSION_PRIMARY_V1"),
  /** Phase E: Fusion-local learning from downstream proxies (advisory only; default off). */
  globalFusionLearningV1: envTrue("FEATURE_GLOBAL_FUSION_LEARNING_V1"),
  globalFusionLearningPersistenceV1: envTrue("FEATURE_GLOBAL_FUSION_LEARNING_PERSISTENCE_V1"),
  globalFusionLearningAdaptiveWeightsV1: envTrue("FEATURE_GLOBAL_FUSION_LEARNING_ADAPTIVE_WEIGHTS_V1"),
  /** Phase F: Fusion-local governance / safety evaluation (default off). */
  globalFusionGovernanceV1: envTrue("FEATURE_GLOBAL_FUSION_GOVERNANCE_V1"),
  globalFusionAutoFreezeV1: envTrue("FEATURE_GLOBAL_FUSION_AUTO_FREEZE_V1"),
  globalFusionAutoRollbackSignalV1: envTrue("FEATURE_GLOBAL_FUSION_AUTO_ROLLBACK_SIGNAL_V1"),
  /** Phase G: Executive operating layer — company-level summaries (read-only; default off). */
  globalFusionExecutiveLayerV1: envTrue("FEATURE_GLOBAL_FUSION_EXECUTIVE_LAYER_V1"),
  /** Phase G: optional process-local snapshot of executive summaries (default off). */
  globalFusionExecutivePersistenceV1: envTrue("FEATURE_GLOBAL_FUSION_EXECUTIVE_PERSISTENCE_V1"),
  /** Phase G: executive feed payload for command centers / governance consumers (default off). */
  globalFusionExecutiveFeedV1: envTrue("FEATURE_GLOBAL_FUSION_EXECUTIVE_FEED_V1"),
  /** Phase H: Company operating protocol — coordination contract (read-only; default off). */
  globalFusionProtocolV1: envTrue("FEATURE_GLOBAL_FUSION_PROTOCOL_V1"),
  globalFusionProtocolFeedV1: envTrue("FEATURE_GLOBAL_FUSION_PROTOCOL_FEED_V1"),
  globalFusionProtocolMonitoringV1: envTrue("FEATURE_GLOBAL_FUSION_PROTOCOL_MONITORING_V1"),
} as const;

export type GlobalFusionFlagKey = keyof typeof globalFusionFlags;

/**
 * Executive AI control center — read-only multi-system governance dashboard (default off).
 * Does not execute actions or toggle flags.
 */
export const controlCenterFlags = {
  aiControlCenterV1: envTrue("FEATURE_AI_CONTROL_CENTER_V1"),
  /** Tabbed company command center (V2) — additive to V1; default off. */
  companyCommandCenterV2: envTrue("FEATURE_COMPANY_COMMAND_CENTER_V2"),
  /** Role-based company command center (V3) — additive to V1/V2; default off. */
  companyCommandCenterV3: envTrue("FEATURE_COMPANY_COMMAND_CENTER_V3"),
  /** Executive briefing + digest + deltas (V4) — additive; default off. */
  companyCommandCenterV4: envTrue("FEATURE_COMPANY_COMMAND_CENTER_V4"),
  /** Operational modes command center (V5) — additive; default off. */
  companyCommandCenterV5: envTrue("FEATURE_COMPANY_COMMAND_CENTER_V5"),
  /** Executive governance modes (V6) — board / diligence / war room / audit; additive; default off. */
  companyCommandCenterV6: envTrue("FEATURE_COMPANY_COMMAND_CENTER_V6"),
} as const;

export type ControlCenterFlagKey = keyof typeof controlCenterFlags;

export function isPlatformCoreAuditEffective(): boolean {
  if (process.env.FEATURE_PLATFORM_CORE_AUDIT_V1 === "false" || process.env.FEATURE_PLATFORM_CORE_AUDIT_V1 === "0") {
    return false;
  }
  if (platformCoreFlags.platformCoreV1) return true;
  return platformCoreFlags.platformCoreAuditV1;
}

/**
 * LECIPM Operator V2 — budget prep + external ad sync (default off).
 * External writes require V2 budget sync + FEATURE_OPERATOR_EXTERNAL_SYNC_V1 + provider flag; validate credentials before production.
 */
export const operatorV2Flags = {
  operatorV2BudgetSyncV1: envTrue("FEATURE_OPERATOR_V2_BUDGET_SYNC_V1"),
  operatorExternalSyncV1: envTrue("FEATURE_OPERATOR_EXTERNAL_SYNC_V1"),
  operatorProviderMetaV1: envTrue("FEATURE_OPERATOR_PROVIDER_META_V1"),
  operatorProviderGoogleV1: envTrue("FEATURE_OPERATOR_PROVIDER_GOOGLE_V1"),
  /** Global priority scoring (trust + profit + confidence + urgency); additive to assistant layer. */
  operatorV2PriorityV1: envTrue("FEATURE_OPERATOR_V2_PRIORITY"),
  /** Deterministic conflict groups + keep-highest-priority resolution. */
  operatorV2ConflictEngineV1: envTrue("FEATURE_OPERATOR_V2_CONFLICT_ENGINE"),
  /** Capped execution plan (guardrails + batch size). */
  operatorV2ExecutionPlanV1: envTrue("FEATURE_OPERATOR_V2_EXECUTION_PLAN"),
  /** Heuristic simulation preview (labeled estimates only). */
  operatorV2SimulationV1: envTrue("FEATURE_OPERATOR_V2_SIMULATION"),
} as const;

export type OperatorV2FlagKey = keyof typeof operatorV2Flags;

/** True when outbound provider budget mutations are allowed by flags (still requires runtime credentials in adapters). */
export function isOperatorExternalBudgetWriteEnabled(provider: "META" | "GOOGLE"): boolean {
  if (!operatorV2Flags.operatorV2BudgetSyncV1 || !operatorV2Flags.operatorExternalSyncV1) return false;
  if (provider === "META") return operatorV2Flags.operatorProviderMetaV1;
  if (provider === "GOOGLE") return operatorV2Flags.operatorProviderGoogleV1;
  return false;
}

/** Default ON when unset — set `FEATURE_*=false` to disable a layer. */
function securityFlagDefaultOn(key: string): boolean {
  const v = process.env[key];
  if (v === "false" || v === "0") return false;
  return true;
}

/**
 * LECIPM Security Hardening v1 — global middleware + validation + audit (additive).
 */
export const securityHardeningV1Flags = {
  securityGlobalV1: securityFlagDefaultOn("FEATURE_SECURITY_GLOBAL_V1"),
  rateLimitV1: securityFlagDefaultOn("FEATURE_RATE_LIMIT_V1"),
  inputValidationV1: securityFlagDefaultOn("FEATURE_INPUT_VALIDATION_V1"),
  apiGuardV1: securityFlagDefaultOn("FEATURE_API_GUARD_V1"),
  securityLoggingV1: securityFlagDefaultOn("FEATURE_SECURITY_LOGGING_V1"),
} as const;

export type SecurityHardeningV1FlagKey = keyof typeof securityHardeningV1Flags;

export type EngineFlagKey = keyof typeof engineFlags;

export const FEATURE_BROKER_ACQUISITION_V1 = engineFlags.brokerAcquisitionV1;
export const FEATURE_ADS_ENGINE_V1 = engineFlags.adsEngineV1;
export const FEATURE_FUNNEL_SYSTEM_V1 = engineFlags.funnelSystemV1;
export const FEATURE_DEAL_EXECUTION_PLAN_V1 = engineFlags.dealExecutionPlanV1;
export const FEATURE_ADS_STARTER_PLAN_V1 = engineFlags.adsStarterPlanV1;
export const FEATURE_BROKER_SOURCING_V1 = engineFlags.brokerSourcingV1;
export const FEATURE_LANDING_PAGE_V1 = engineFlags.landingPageV1;
export const FEATURE_CLOSING_PLAYBOOK_V1 = engineFlags.closingPlaybookV1;
export const FEATURE_LEAD_FOLLOWUP_V1 = engineFlags.leadFollowupV1;
export const FEATURE_BROKER_CLOSING_ADVANCED_V1 = engineFlags.brokerClosingAdvancedV1;
export const FEATURE_SCALING_BLUEPRINT_V1 = engineFlags.scalingBlueprintV1;
export const FEATURE_AI_ASSIST_EXECUTION_V1 = engineFlags.aiAssistExecutionV1;
export const FEATURE_BROKER_COMPETITION_V1 = engineFlags.brokerCompetitionV1;
export const FEATURE_SCALE_SYSTEM_V1 = engineFlags.scaleSystemV1;
export const FEATURE_AUTONOMOUS_MARKETPLACE_V1 = engineFlags.autonomousMarketplaceV1;
export const FEATURE_INVESTOR_PITCH_V1 = engineFlags.investorPitchV1;
export const FEATURE_CITY_DOMINATION_V1 = engineFlags.cityDominationV1;
export const FEATURE_SCALE_ROADMAP_V1 = engineFlags.scaleRoadmapV1;
export const FEATURE_FUNDRAISING_V1 = engineFlags.fundraisingV1;
export const FEATURE_MOAT_ENGINE_V1 = engineFlags.moatEngineV1;
export const FEATURE_DAILY_ROUTINE_V1 = engineFlags.dailyRoutineV1;
export const FEATURE_PITCH_SCRIPT_V1 = engineFlags.pitchScriptV1;
export const FEATURE_CITY_DOMINATION_MTL_V1 = engineFlags.cityDominationMtlV1;
export const FEATURE_DEAL_CLOSING_V1 = engineFlags.dealClosingV1;
export const FEATURE_COMPOUNDING_V1 = engineFlags.compoundingV1;
export const FEATURE_CONVERSATION_ENGINE_V1 = engineFlags.conversationEngineV1;
export const FEATURE_ANTI_GHOSTING_V1 = engineFlags.antiGhostingV1;
export const FEATURE_CLOSING_PSYCHOLOGY_V1 = engineFlags.closingPsychologyV1;
export const FEATURE_TIMING_OPTIMIZER_V1 = engineFlags.timingOptimizerV1;
export const FEATURE_BROKER_LOCKIN_V1 = engineFlags.brokerLockinV1;
export const FEATURE_GROWTH_POLICY_V1 = engineFlags.growthPolicyV1;
export const FEATURE_HUB_JOURNEY_V1 = engineFlags.hubJourneyV1;
export const FEATURE_HUB_COPILOT_V1 = engineFlags.hubCopilotV1;

/** @see engineFlags.syriaRegionAdapterV1 — Syria regional read path for global intelligence / dashboards. */
export const FEATURE_SYRIA_REGION_ADAPTER_V1 = engineFlags.syriaRegionAdapterV1;
/** @see engineFlags.regionListingKeyV1 */
export const FEATURE_REGION_LISTING_KEY_V1 = engineFlags.regionListingKeyV1;
/** @see engineFlags.syriaPreviewV1 — Syria listing preview pipeline (DRY_RUN only). */
export const FEATURE_SYRIA_PREVIEW_V1 = engineFlags.syriaPreviewV1;

function envTrue(k: string): boolean {
  return process.env[k] === "true" || process.env[k] === "1";
}

/**
 * Legal Hub — deterministic intelligence, review priority, anomaly surfacing (default off).
 */
export const legalIntelligenceFlags = {
  legalIntelligenceV1: envTrue("FEATURE_LEGAL_INTELLIGENCE_V1"),
  legalReviewPriorityV1: envTrue("FEATURE_LEGAL_REVIEW_PRIORITY_V1"),
  legalAnomalyDetectionV1: envTrue("FEATURE_LEGAL_ANOMALY_DETECTION_V1"),
} as const;

export type LegalIntelligenceFlagKey = keyof typeof legalIntelligenceFlags;

/**
 * Revenue Enforcement V1 — log + soft guard wrappers (default off). Does not change Stripe webhooks.
 */
export const revenueEnforcementFlags = {
  revenueEnforcementV1: envTrue("FEATURE_REVENUE_ENFORCEMENT_V1"),
  revenueDashboardV1: envTrue("FEATURE_REVENUE_DASHBOARD_V1"),
} as const;

export const FEATURE_REVENUE_DASHBOARD_V1 = revenueEnforcementFlags.revenueDashboardV1;

/**
 * Instant value + conversion UX (V1) — additive copy/components; no payment core changes.
 */
export const conversionEngineFlags = {
  instantValueV1: envTrue("FEATURE_INSTANT_VALUE_V1"),
  conversionUpgradeV1: envTrue("FEATURE_CONVERSION_UPGRADE_V1"),
  realUrgencyV1: envTrue("FEATURE_REAL_URGENCY_V1"),
} as const;

/**
 * Growth Autopilot v3 — self-learning, predictive, multi-channel (all default off).
 * TODO v4: ML models, RL, automated budget allocation, cross-platform intelligence.
 */
export const growthV3Flags = {
  growthBrainV1: envTrue("FEATURE_GROWTH_BRAIN_V1"),
  growthSignalStreamV1: envTrue("FEATURE_GROWTH_SIGNAL_STREAM_V1"),
  lifecycleEngineV1: envTrue("FEATURE_LIFECYCLE_ENGINE_V1"),
  predictiveModelsV1: envTrue("FEATURE_PREDICTIVE_MODELS_V1"),
  orchestrationEngineV1: envTrue("FEATURE_ORCHESTRATION_ENGINE_V1"),
  seoAutopilotV3: envTrue("FEATURE_SEO_AUTOPILOT_V3"),
  referralEngineV3: envTrue("FEATURE_REFERRAL_ENGINE_V3"),
  contentEngineV1: envTrue("FEATURE_CONTENT_ENGINE_V1"),
  experimentsAutoV1: envTrue("FEATURE_EXPERIMENTS_AUTO_V1"),
  flywheelEngineV1: envTrue("FEATURE_FLYWHEEL_ENGINE_V1"),
  revenueGrowthV1: envTrue("FEATURE_REVENUE_GROWTH_V1"),
  autonomySystemV1: envTrue("FEATURE_AUTONOMY_SYSTEM_V1"),
} as const;

export type GrowthV3FlagKey = keyof typeof growthV3Flags;

/**
 * Revenue Engine v4 — dynamic pricing, monetization intelligence, investor metrics (default off).
 * Pricing changes are never auto-applied unless host/seller policy + SAFE_AUTOPILOT allow listed safe actions.
 */
export const revenueV4Flags = {
  revenueEngineV1: envTrue("FEATURE_REVENUE_ENGINE_V1"),
  pricingEngineV1: envTrue("FEATURE_PRICING_ENGINE_V1"),
  /** Explainable scenarios, percentiles, BNHub-aware wrapper — recommendation-only. */
  pricingEngineV2: envTrue("FEATURE_PRICING_ENGINE_V2"),
  bnhubDynamicPricingV1: envTrue("FEATURE_BNHUB_DYNAMIC_PRICING_V1"),
  investorInsightsV1: envTrue("FEATURE_INVESTOR_INSIGHTS_V1"),
  monetizationEngineV1: envTrue("FEATURE_MONETIZATION_ENGINE_V1"),
  /** Go-to-market scripts + sales assistant APIs (`/api/gtm/*`). */
  gtmEngineV1: envTrue("FEATURE_GTM_ENGINE_V1"),
  /** Optional small ranking blend from monetization proxies — capped; never boosts low-trust shells. */
  revenueRankingBlendV1: envTrue("FEATURE_REVENUE_RANKING_BLEND_V1"),
} as const;

export type RevenueV4FlagKey = keyof typeof revenueV4Flags;

/**
 * Fraud + Trust AI system — risk scoring, admin review, explainable signals (default off).
 * Public UI must use `getPublicTrustPresentation` (trust/publicLabels) — never raw suspicion labels.
 */
export const fraudTrustV1Flags = {
  trustSystemV1: envTrue("FEATURE_TRUST_SYSTEM_V1"),
  fraudDetectionV1: envTrue("FEATURE_FRAUD_DETECTION_V1"),
  /** Auditable `fraud_events` rows + launch fraud facade (additive; default off). */
  launchFraudProtectionV1: envTrue("FEATURE_LAUNCH_FRAUD_PROTECTION_V1"),
  riskScoringV1: envTrue("FEATURE_RISK_SCORING_V1"),
  deviceAnalysisV1: envTrue("FEATURE_DEVICE_ANALYSIS_V1"),
  imageVerificationV1: envTrue("FEATURE_IMAGE_VERIFICATION_V1"),
} as const;

export type FraudTrustV1FlagKey = keyof typeof fraudTrustV1Flags;

/**
 * Autonomous Marketplace AI v5 — agents, negotiation hints, market intel (default off).
 * Irreversible actions remain blocked; high-impact suggestions require human approval.
 */
export const marketplaceAiV5Flags = {
  agentSystemV1: envTrue("FEATURE_AGENT_SYSTEM_V1"),
  negotiationEngineV1: envTrue("FEATURE_NEGOTIATION_ENGINE_V1"),
  dealAssistantV1: envTrue("FEATURE_DEAL_ASSISTANT_V1"),
  marketIntelligenceV1: envTrue("FEATURE_MARKET_INTELLIGENCE_V1"),
} as const;

export type MarketplaceAiV5FlagKey = keyof typeof marketplaceAiV5Flags;

/**
 * BNHub v2 — guest conversion, host revenue/autopilot, ranking, pricing intelligence, admin control (default off).
 * Backward compatible: when off, existing BNHub routes and UI behave as before.
 */
export const bnhubV2Flags = {
  bnhubV2: envTrue("FEATURE_BNHUB_V2"),
  bnhubRankingV1: envTrue("FEATURE_BNHUB_RANKING_V1"),
  /** Host dashboard: listing performance + ranking explainability (advisory-only). Default off. */
  bnhubHostPerformanceV1: envTrue("FEATURE_BNHUB_HOST_PERFORMANCE_V1"),
  /** Host dashboard: concrete improvement suggestions (requires performance panel when on). Default off. */
  bnhubHostRecommendationsV1: envTrue("FEATURE_BNHUB_HOST_RECOMMENDATIONS_V1"),
  bnhubPricingEngineV1: envTrue("FEATURE_BNHUB_PRICING_ENGINE_V1"),
  bnhubTrustSystemV1: envTrue("FEATURE_BNHUB_TRUST_SYSTEM_V1"),
  bnhubAutopilotV1: envTrue("FEATURE_BNHUB_AUTOPILOT_V1"),
  bnhubAdminControlV1: envTrue("FEATURE_BNHUB_ADMIN_CONTROL_V1"),
} as const;

export type BnhubV2FlagKey = keyof typeof bnhubV2Flags;

/**
 * BNHub guest conversion layer — read-only metrics, friction hints, advisory recommendations (default off).
 * Does not change bookings, payments, ranking, or listing content.
 */
export const bnhubGuestConversionFlags = {
  guestConversionV1: envTrue("FEATURE_BNHUB_GUEST_CONVERSION_V1"),
  bookingFrictionV1: envTrue("FEATURE_BNHUB_BOOKING_FRICTION_V1"),
  recommendationsV1: envTrue("FEATURE_BNHUB_GUEST_CONVERSION_RECOMMENDATIONS_V1"),
} as const;

export type BnhubGuestConversionFlagKey = keyof typeof bnhubGuestConversionFlags;

/** Env parity aliases (`FEATURE_BNHUB_*`); prefer `bnhubGuestConversionFlags` in code. */
export const FEATURE_BNHUB_GUEST_CONVERSION_V1 = bnhubGuestConversionFlags.guestConversionV1;
export const FEATURE_BNHUB_BOOKING_FRICTION_V1 = bnhubGuestConversionFlags.bookingFrictionV1;
export const FEATURE_BNHUB_GUEST_CONVERSION_RECOMMENDATIONS_V1 = bnhubGuestConversionFlags.recommendationsV1;

/**
 * BNHub guest conversion layer V1 — funnel metrics, host/admin panels, client beacons (read-only / advisory).
 * Client instrumentation also requires `NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1=1`.
 */
export const bnhubConversionLayerFlags = {
  conversionV1: envTrue("FEATURE_BNHUB_CONVERSION_V1"),
  adminV1: envTrue("FEATURE_BNHUB_CONVERSION_ADMIN_V1"),
} as const;

export type BnhubConversionLayerFlagKey = keyof typeof bnhubConversionLayerFlags;

export const FEATURE_BNHUB_CONVERSION_V1 = bnhubConversionLayerFlags.conversionV1;
export const FEATURE_BNHUB_CONVERSION_ADMIN_V1 = bnhubConversionLayerFlags.adminV1;

/** Client beacon (`bnhub-guest-conversion-tracker`) reads this at build/runtime in the browser bundle. */
export function readPublicBnhubConversionV1(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1;
  return v === "1" || v === "true";
}

/**
 * Revenue/funnel conclusions need **both** server UI flag and public tracking flag.
 * If only one is on, DB aggregates and client local signals disagree — treat as misconfigured.
 */
export function isBnhubConversionLayerFullyAligned(): boolean {
  return bnhubConversionLayerFlags.conversionV1 && readPublicBnhubConversionV1();
}

/**
 * BNHub Mission Control V1 — unified read-only operational dashboard (ranking + host + guest + booking + trust + pricing signals).
 */
export const bnhubMissionControlFlags = {
  missionControlV1: envTrue("FEATURE_BNHUB_MISSION_CONTROL_V1"),
} as const;

export type BnhubMissionControlFlagKey = keyof typeof bnhubMissionControlFlags;

export const FEATURE_BNHUB_MISSION_CONTROL_V1 = bnhubMissionControlFlags.missionControlV1;

/**
 * BNHub safe autopilot — approved listing content updates + rollback (default off).
 */
export const bnhubAutopilotExecutionFlags = {
  autopilotV1: envTrue("FEATURE_BNHUB_AUTOPILOT_V1"),
  executionV1: envTrue("FEATURE_BNHUB_AUTOPILOT_EXECUTION_V1"),
  rollbackV1: envTrue("FEATURE_BNHUB_AUTOPILOT_ROLLBACK_V1"),
} as const;

export type BnhubAutopilotExecutionFlagKey = keyof typeof bnhubAutopilotExecutionFlags;

export const FEATURE_BNHUB_AUTOPILOT_V1 = bnhubAutopilotExecutionFlags.autopilotV1;
export const FEATURE_BNHUB_AUTOPILOT_EXECUTION_V1 = bnhubAutopilotExecutionFlags.executionV1;
export const FEATURE_BNHUB_AUTOPILOT_ROLLBACK_V1 = bnhubAutopilotExecutionFlags.rollbackV1;

/**
 * LECIPM Growth Engine v1 — Montreal supply/demand intelligence, acquisition drafts, funnels (default off).
 * All outbound drafts require human review; no auto-spam. Law 25 / consent respected at send-time.
 */
export const montrealGrowthEngineFlags = {
  montrealGrowthEngineV1: envTrue("FEATURE_MONTREAL_GROWTH_ENGINE_V1"),
  supplyAcquisitionV1: envTrue("FEATURE_SUPPLY_ACQUISITION_V1"),
  demandAcquisitionV1: envTrue("FEATURE_DEMAND_ACQUISITION_V1"),
  referralEngineV1: envTrue("FEATURE_REFERRAL_ENGINE_GROWTH_V1"),
  dominationStrategyV1: envTrue("FEATURE_DOMINATION_STRATEGY_V1"),
} as const;

export type MontrealGrowthEngineFlagKey = keyof typeof montrealGrowthEngineFlags;

/**
 * Intelligence layer — explainable autopilot v2, liquidity, investor analytics (default off).
 */
export const intelligenceFlags = {
  autopilotV2: envTrue("FEATURE_AUTOPILOT_V2"),
  liquidityEngineV1: envTrue("FEATURE_LIQUIDITY_ENGINE_V1"),
  analyticsDashboardV1: envTrue("FEATURE_ANALYTICS_DASHBOARD_V1"),
} as const;

/**
 * Admin Market Intelligence Command Center + Executive KPI Board (aggregates only; default off).
 * Env names align with rollout: `command_center_v1`, `executive_dashboard_v1`, `market_intelligence_v1`.
 */
export const commandCenterFlags = {
  commandCenterV1: envTrue("FEATURE_COMMAND_CENTER_V1"),
  executiveDashboardV1: envTrue("FEATURE_EXECUTIVE_DASHBOARD_V1"),
  /** Strategic MI insights feed (dashboards); distinct env from agent `FEATURE_MARKET_INTELLIGENCE_V1` if needed. */
  marketIntelligenceDashboardV1: envTrue("FEATURE_MI_COMMAND_CENTER_V1"),
} as const;

export type IntelligenceFlagKey = keyof typeof intelligenceFlags;

/**
 * Host economics — ROI calculator, pricing copy, Montreal simulations (default off).
 */
export const hostEconomicsFlags = {
  roiCalculatorV1: envTrue("FEATURE_ROI_CALCULATOR_V1"),
  pricingModelV1: envTrue("FEATURE_PRICING_MODEL_V1"),
  montrealSimulationV1: envTrue("FEATURE_MONTREAL_SIMULATION_V1"),
  hostConversionSurfacesV1: envTrue("FEATURE_HOST_CONVERSION_SURFACES_V1"),
  /** Host lead capture, onboarding sessions, listing import queue. */
  hostOnboardingFunnelV1: envTrue("FEATURE_HOST_ONBOARDING_FUNNEL_V1"),
} as const;

export type HostEconomicsFlagKey = keyof typeof hostEconomicsFlags;

/**
 * LECIPM Monetization System v1 — short env aliases (`FEATURE_PRICING_V1`, …) OR existing Revenue v4 / host-economics flags.
 * Setting either alias or the legacy flag enables the same surfaces (backward compatible).
 */
export const lecipmMonetizationSystemV1 = {
  pricingV1: envTrue("FEATURE_PRICING_V1") || revenueV4Flags.pricingEngineV1,
  monetizationV1: envTrue("FEATURE_MONETIZATION_V1") || revenueV4Flags.monetizationEngineV1,
  roiV1: envTrue("FEATURE_ROI_V1") || hostEconomicsFlags.roiCalculatorV1,
  gtmV1: envTrue("FEATURE_GTM_V1") || revenueV4Flags.gtmEngineV1,
  /** `/api/stripe/create-checkout-session` + `/api/stripe/create-subscription` (LECIPM wrappers). */
  stripeMonetizationApiV1:
    envTrue("FEATURE_LECIPM_STRIPE_MONETIZATION_API_V1") ||
    envTrue("FEATURE_PRICING_V1") ||
    revenueV4Flags.pricingEngineV1,
} as const;

export type LecipmMonetizationSystemV1Key = keyof typeof lecipmMonetizationSystemV1;

/**
 * LECIPM Launch System v1 — readiness checklist, Montreal host pipeline, outreach CRM, investor deck (default off).
 * Complements `lecipmLaunchInvestorFlags` — enable either or both for founder consoles.
 */
export const launchSystemV1Flags = {
  launchSystemV1: envTrue("FEATURE_LAUNCH_SYSTEM_V1"),
  hostAcquisitionPipelineV1: envTrue("FEATURE_HOST_ACQUISITION_PIPELINE_V1") || engineFlags.hostAcquisitionV1,
  outreachCrmV1: envTrue("FEATURE_OUTREACH_V1"),
  investorPitchDeckV1: envTrue("FEATURE_INVESTOR_PITCH_V1"),
} as const;

export type LaunchSystemV1FlagKey = keyof typeof launchSystemV1Flags;

/**
 * High-conversion marketing landing — full page composition, pricing strip, ROI CTAs (default off).
 * Set `NEXT_PUBLIC_FEATURE_LANDING_V1` alongside to hide global header/footer on home for standalone shell.
 */
/** High-conversion homepage — `app/page.tsx` + `/[locale]/[country]/page.tsx` use `LecipmMarketingLandingV1` when `landingV1`. */
export const marketingLandingFlags = {
  /** Alias: `landing_v1` — full marketing shell (Navbar → Footer). Env: `FEATURE_LANDING_V1` */
  landingV1: envTrue("FEATURE_LANDING_V1"),
  /** Alias: `pricing_v1` — live plan cards from `getPricingPlans()` when combined with `FEATURE_PRICING_MODEL_V1`. Env: `FEATURE_LANDING_PRICING_V1` */
  landingPricingV1: envTrue("FEATURE_LANDING_PRICING_V1"),
  /** Alias: `roi_integration_v1` — CTAs target `/hosts/roi-calculator`. Env: `FEATURE_LANDING_ROI_INTEGRATION_V1` */
  landingRoiIntegrationV1: envTrue("FEATURE_LANDING_ROI_INTEGRATION_V1"),
} as const;

export type MarketingLandingFlagKey = keyof typeof marketingLandingFlags;

/**
 * Platform-wide design system — tokens, layouts, unified navigation (gradual adoption).
 * Does not auto-rewrite existing pages; use DS components behind these flags for safe rollout.
 */
/** Roll out `@/design-system` + `ds-*` surfaces without rewriting every route at once. */
export const designSystemFlags = {
  /** Alias: `design_system_v1` */
  designSystemV1: envTrue("FEATURE_DESIGN_SYSTEM_V1"),
  /** Alias: `ui_unification_v1` — templates + navigation shells */
  uiUnificationV1: envTrue("FEATURE_UI_UNIFICATION_V1"),
  /** Alias: `ai_insights_v1` — prefer `@/components/ai/*` insight cards on dashboards */
  aiInsightsV1: envTrue("FEATURE_AI_INSIGHTS_V1"),
} as const;

export type DesignSystemFlagKey = keyof typeof designSystemFlags;

/**
 * Broker deal execution copilot + contract/document intelligence (Quebec / OACIQ-aligned assistance).
 * Does not replace mandatory official forms; broker review and audit trails required for high-impact outputs.
 */
export const dealExecutionFlags = {
  dealExecutionCopilotV1: envTrue("FEATURE_DEAL_EXECUTION_COPILOT_V1"),
  contractIntelligenceV1: envTrue("FEATURE_CONTRACT_INTELLIGENCE_V1"),
  draftingKnowledgeV1: envTrue("FEATURE_DRAFTING_KNOWLEDGE_V1"),
  brokerReviewWorkflowV1: envTrue("FEATURE_BROKER_REVIEW_WORKFLOW_V1"),
  formRenderingV1: envTrue("FEATURE_FORM_RENDERING_V1"),
} as const;

export type DealExecutionFlagKey = keyof typeof dealExecutionFlags;

/**
 * Broker Agent — residential command center (Quebec brokerage ops; default off).
 */
export const brokerResidentialFlags = {
  brokerResidentialDashboardV1: envTrue("FEATURE_BROKER_RESIDENTIAL_DASHBOARD_V1"),
  residentialDealWorkspaceV1: envTrue("FEATURE_RESIDENTIAL_DEAL_WORKSPACE_V1"),
  residentialDocumentWorkspaceV1: envTrue("FEATURE_RESIDENTIAL_DOCUMENT_WORKSPACE_V1"),
  residentialCopilotV1: envTrue("FEATURE_RESIDENTIAL_COPILOT_V1"),
  residentialKnowledgeHooksV1: envTrue("FEATURE_RESIDENTIAL_KNOWLEDGE_HOOKS_V1"),
} as const;

export type BrokerResidentialFlagKey = keyof typeof brokerResidentialFlags;

/**
 * Mobile broker workflow + daily action center + push (Québec residential; default off).
 * Env: `FEATURE_BROKER_MOBILE_WORKFLOW_V1`, `FEATURE_DAILY_ACTION_CENTER_V1`, …
 */
export const brokerMobileFlags = {
  brokerMobileWorkflowV1: envTrue("FEATURE_BROKER_MOBILE_WORKFLOW_V1"),
  dailyActionCenterV1: envTrue("FEATURE_DAILY_ACTION_CENTER_V1"),
  brokerPushNotificationsV1: envTrue("FEATURE_BROKER_PUSH_NOTIFICATIONS_V1"),
  mobileQuickApprovalsV1: envTrue("FEATURE_MOBILE_QUICK_APPROVALS_V1"),
  mobileOfflineCacheV1: envTrue("FEATURE_MOBILE_OFFLINE_CACHE_V1"),
} as const;

export type BrokerMobileFlagKey = keyof typeof brokerMobileFlags;

/**
 * Broker KPI board, brokerage team collaboration, workload intelligence (internal ops; default off).
 */
export const brokerOpsFlags = {
  brokerKpiBoardV1: envTrue("FEATURE_BROKER_KPI_BOARD_V1"),
  brokerageTeamCollabV1: envTrue("FEATURE_BROKERAGE_TEAM_COLLAB_V1"),
  brokerWorkloadIntelligenceV1: envTrue("FEATURE_BROKER_WORKLOAD_INTELLIGENCE_V1"),
  teamKpiAggregationV1: envTrue("FEATURE_TEAM_KPI_AGGREGATION_V1"),
  /** Personal Broker Growth Dashboard v1 — Québec residential metrics + trends */
  personalBrokerGrowthDashboardV1: envTrue("FEATURE_PERSONAL_BROKER_GROWTH_DASHBOARD_V1"),
  /** AI Marketing Autopilot — drafts only; broker review before publish */
  residentialMarketingAutopilotV1: envTrue("FEATURE_RESIDENTIAL_MARKETING_AUTOPILOT_V1"),
  /** Listing marketing intelligence (health/exposure/conversion signals) */
  listingMarketingIntelligenceV1: envTrue("FEATURE_LISTING_MARKETING_INTELLIGENCE_V1"),
  /** Growth coach — goals vs progress, next actions */
  brokerGrowthCoachV1: envTrue("FEATURE_BROKER_GROWTH_COACH_V1"),
} as const;

export type BrokerOpsFlagKey = keyof typeof brokerOpsFlags;

/**
 * Brokerage owner / executive — company metrics, owner dashboard, strategy board, forecasting (default off).
 */
export const executiveDashboardFlags = {
  ownerDashboardV1: envTrue("FEATURE_OWNER_DASHBOARD_V1"),
  companyStrategyBoardV1: envTrue("FEATURE_COMPANY_STRATEGY_BOARD_V1"),
  companyForecastingV1: envTrue("FEATURE_COMPANY_FORECASTING_V1"),
  executiveCompanyMetricsV1: envTrue("FEATURE_EXECUTIVE_COMPANY_METRICS_V1"),
} as const;

export type ExecutiveDashboardFlagKey = keyof typeof executiveDashboardFlags;

/**
 * Founder workspace — AI copilot, weekly executive briefing, action tracking (default off).
 * Residential brokerage executive scope only; requires `requireExecutiveSession`.
 */
export const founderWorkspaceFlags = {
  founderAiCopilotV1: envTrue("FEATURE_FOUNDER_AI_COPILOT_V1"),
  weeklyExecutiveBriefingV1: envTrue("FEATURE_WEEKLY_EXECUTIVE_BRIEFING_V1"),
  founderActionTrackingV1: envTrue("FEATURE_FOUNDER_ACTION_TRACKING_V1"),
  companyInsightSynthesisV1: envTrue("FEATURE_COMPANY_INSIGHT_SYNTHESIS_V1"),
} as const;

export type FounderWorkspaceFlagKey = keyof typeof founderWorkspaceFlags;

/**
 * LECIPM Launch + Investor System v1 — first-user traction, scaling signals, investor-ready exports (default off).
 * Metrics are DB-backed only; narratives label estimates; exports are auditable.
 */
export const lecipmLaunchInvestorFlags = {
  lecipmLaunchInvestorSystemV1: envTrue("FEATURE_LECIPM_LAUNCH_INVESTOR_SYSTEM_V1"),
  earlyTractionV1: envTrue("FEATURE_EARLY_TRACTION_V1"),
  scalingGrowthV1: envTrue("FEATURE_SCALING_GROWTH_V1"),
  investorMetricsV1: envTrue("FEATURE_INVESTOR_METRICS_V1"),
  investorStoryV1: envTrue("FEATURE_INVESTOR_STORY_V1"),
  positioningEngineV1: envTrue("FEATURE_POSITIONING_ENGINE_V1"),
} as const;

export type LecipmLaunchInvestorFlagKey = keyof typeof lecipmLaunchInvestorFlags;

/**
 * 3-month revenue simulation + investor pitch wording v1 (founder console; default off).
 * Env snake_case aliases: `founder_launch_simulation_v1`, `investor_pitch_wording_v1`, `pitch_export_v1`, `montreal_projection_v1`.
 */
export const founderSimulationFlags = {
  founderLaunchSimulationV1: envTrue("FEATURE_FOUNDER_LAUNCH_SIMULATION_V1"),
  investorPitchWordingV1: envTrue("FEATURE_INVESTOR_PITCH_WORDING_V1"),
  pitchExportV1: envTrue("FEATURE_PITCH_EXPORT_V1"),
  montrealProjectionV1: envTrue("FEATURE_MONTREAL_PROJECTION_V1"),
} as const;

export type FounderSimulationFlagKey = keyof typeof founderSimulationFlags;

/**
 * Admin compliance command center + brokerage QA/review engine (internal supervisory; default off).
 */
export const complianceAdminFlags = {
  adminComplianceCommandCenterV1: envTrue("FEATURE_ADMIN_COMPLIANCE_COMMAND_CENTER_V1"),
  brokerageQaReviewV1: envTrue("FEATURE_BROKERAGE_QA_REVIEW_V1"),
  complianceRuleEngineV1: envTrue("FEATURE_COMPLIANCE_RULE_ENGINE_V1"),
  supervisoryQueueV1: envTrue("FEATURE_SUPERVISORY_QUEUE_V1"),
} as const;

export type ComplianceAdminFlagKey = keyof typeof complianceAdminFlags;

/**
 * Residential multi-broker office + commission/billing/payout (preferred env names for LECIPM Québec residential brokerage).
 * When set, the matching capability is enabled alongside legacy `FEATURE_OFFICE_*` / `FEATURE_BROKER_*` flags.
 */
export const residentialOfficeFlags = {
  residentialOfficeManagementV1: envTrue("FEATURE_RESIDENTIAL_OFFICE_MANAGEMENT_V1"),
  residentialCommissionEngineV1: envTrue("FEATURE_RESIDENTIAL_COMMISSION_ENGINE_V1"),
  residentialBrokerageBillingV1: envTrue("FEATURE_RESIDENTIAL_BROKERAGE_BILLING_V1"),
  residentialBrokerPayoutsV1: envTrue("FEATURE_RESIDENTIAL_BROKER_PAYOUTS_V1"),
  residentialOfficeFinanceAnalyticsV1: envTrue("FEATURE_RESIDENTIAL_OFFICE_FINANCE_ANALYTICS_V1"),
} as const;

export type ResidentialOfficeFlagKey = keyof typeof residentialOfficeFlags;

/**
 * Multi-broker office management + brokerage commission/billing/payout (role-based; manual review — not accounting finality).
 * Legacy env names OR residential-prefixed flags enable the same surfaces (backward compatible).
 */
export const brokerageOfficeFlags = {
  officeManagementV1:
    envTrue("FEATURE_OFFICE_MANAGEMENT_V1") || residentialOfficeFlags.residentialOfficeManagementV1,
  commissionEngineV1:
    envTrue("FEATURE_COMMISSION_ENGINE_V1") || residentialOfficeFlags.residentialCommissionEngineV1,
  brokerageBillingV1:
    envTrue("FEATURE_BROKERAGE_BILLING_V1") || residentialOfficeFlags.residentialBrokerageBillingV1,
  brokerPayoutsV1:
    envTrue("FEATURE_BROKER_PAYOUTS_V1") || residentialOfficeFlags.residentialBrokerPayoutsV1,
  officeFinanceAnalyticsV1:
    envTrue("FEATURE_OFFICE_FINANCE_ANALYTICS_V1") || residentialOfficeFlags.residentialOfficeFinanceAnalyticsV1,
} as const;

export type BrokerageOfficeFlagKey = keyof typeof brokerageOfficeFlags;

/**
 * AI Contract Engine v1 — specimen-schema intelligence, prefill, validation, clause retrieval (Quebec / OACIQ-aligned).
 * Specimen uploads inform structure only; execution forms remain broker-authorized / publisher workflows.
 */
export const aiContractEngineFlags = {
  aiContractEngineV1: envTrue("FEATURE_AI_CONTRACT_ENGINE_V1"),
  formRegistryV1: envTrue("FEATURE_FORM_REGISTRY_V1"),
  dealPrefillV1: envTrue("FEATURE_DEAL_PREFILL_V1"),
  contractValidationV1: envTrue("FEATURE_CONTRACT_VALIDATION_V1"),
  clauseRetrievalV1: envTrue("FEATURE_CLAUSE_RETRIEVAL_V1"),
  brokerContractWorkspaceV1: envTrue("FEATURE_BROKER_CONTRACT_WORKSPACE_V1"),
  draftExportV1: envTrue("FEATURE_DRAFT_EXPORT_V1"),
} as const;

export type AiContractEngineFlagKey = keyof typeof aiContractEngineFlags;

/**
 * Exact OACIQ field mapper v1 + execution bridge (specimen-oriented; draft until broker review).
 * Env: `FEATURE_OACIQ_EXACT_MAPPER_V1`, per-form `FEATURE_OACIQ_PP_MAPPER_V1`, …, `FEATURE_OACIQ_EXECUTION_BRIDGE_V1`.
 */
export const oaciqMapperFlags = {
  oaciqExactMapperV1: envTrue("FEATURE_OACIQ_EXACT_MAPPER_V1"),
  oaciqPpMapperV1: envTrue("FEATURE_OACIQ_PP_MAPPER_V1"),
  oaciqCpMapperV1: envTrue("FEATURE_OACIQ_CP_MAPPER_V1"),
  oaciqDsMapperV1: envTrue("FEATURE_OACIQ_DS_MAPPER_V1"),
  oaciqIvMapperV1: envTrue("FEATURE_OACIQ_IV_MAPPER_V1"),
  oaciqRisMapperV1: envTrue("FEATURE_OACIQ_RIS_MAPPER_V1"),
  oaciqRhMapperV1: envTrue("FEATURE_OACIQ_RH_MAPPER_V1"),
  oaciqExecutionBridgeV1: envTrue("FEATURE_OACIQ_EXECUTION_BRIDGE_V1"),
} as const;

export type OaciqMapperFlagKey = keyof typeof oaciqMapperFlags;

/**
 * Official execution prep + signature + closing pipeline (broker-gated; does not replace OACIQ).
 * Env: `FEATURE_DEAL_EXECUTION_V1`, `FEATURE_SIGNATURE_SYSTEM_V1`, etc.
 */
export const dealTransactionFlags = {
  dealExecutionV1: envTrue("FEATURE_DEAL_EXECUTION_V1"),
  signatureSystemV1: envTrue("FEATURE_SIGNATURE_SYSTEM_V1"),
  conditionTrackingV1: envTrue("FEATURE_CONDITION_TRACKING_V1"),
  executionAutopilotV1: envTrue("FEATURE_EXECUTION_AUTOPILOT_V1"),
  clientDealViewV1: envTrue("FEATURE_CLIENT_DEAL_VIEW_V1"),
} as const;

export type DealTransactionFlagKey = keyof typeof dealTransactionFlags;

/**
 * Production signature / notary / closing rollout — real providers and Québec notary coordination (env-backed).
 */
export const productionPipelineFlags = {
  signatureRealProvidersV1: envTrue("FEATURE_SIGNATURE_REAL_PROVIDERS_V1"),
  notarySystemV1: envTrue("FEATURE_NOTARY_SYSTEM_V1"),
  closingPipelineV1: envTrue("FEATURE_CLOSING_PIPELINE_V1"),
} as const;

export type ProductionPipelineFlagKey = keyof typeof productionPipelineFlags;

/**
 * Escrow / trust workflow tracking, deal ledger, payment automation, negotiation copilot (broker-gated).
 * LECIPM does not hold trust funds by default — modes are explicit in `LecipmTrustWorkflow.mode`.
 */
export const lecipmPaymentsNegotiationFlags = {
  trustWorkflowV1: envTrue("FEATURE_TRUST_WORKFLOW_V1"),
  paymentAutomationV1: envTrue("FEATURE_PAYMENT_AUTOMATION_V1"),
  dealLedgerV1: envTrue("FEATURE_DEAL_LEDGER_V1"),
  negotiationCopilotV1: envTrue("FEATURE_NEGOTIATION_COPILOT_V1"),
  ppCpNegotiationBridgeV1: envTrue("FEATURE_PP_CP_NEGOTIATION_BRIDGE_V1"),
} as const;

export type LecipmPaymentsNegotiationFlagKey = keyof typeof lecipmPaymentsNegotiationFlags;

/**
 * Québec residential OACIQ form engine + strict AI mapper + execution pipeline integration (broker-controlled).
 */
export const lecipmOaciqFlags = {
  oaciqFormsEngineV1: envTrue("FEATURE_OACIQ_FORMS_ENGINE_V1"),
  aiContractMapperV1: envTrue("FEATURE_AI_CONTRACT_MAPPER_V1"),
  residentialExecutionPipelineV1: envTrue("FEATURE_RESIDENTIAL_EXECUTION_PIPELINE_V1"),
} as const;

export type LecipmOaciqFlagKey = keyof typeof lecipmOaciqFlags;

/**
 * Smart Deal Autopilot + AI Negotiation Assist (broker-controlled; no auto-send to official OACIQ systems).
 */
export const dealAutopilotFlags = {
  smartDealAutopilotV1: envTrue("FEATURE_SMART_DEAL_AUTOPILOT_V1"),
  negotiationAutopilotAssistV1: envTrue("FEATURE_NEGOTIATION_AUTOPILOT_ASSIST_V1"),
  ppCpScenarioBuilderV1: envTrue("FEATURE_PP_CP_SCENARIO_BUILDER_V1"),
  closingReadinessAutopilotV1: envTrue("FEATURE_CLOSING_READINESS_AUTOPILOT_V1"),
} as const;

export type DealAutopilotFlagKey = keyof typeof dealAutopilotFlags;

/** Soft-launch toggles (default: locales on; risky automation off unless env enables). */
export const launchFlags = {
  enableArabic: process.env.ENABLE_ARABIC !== "false",
  enableFrench: process.env.ENABLE_FRENCH !== "false",
  enableSyriaMarket: process.env.ENABLE_SYRIA_MARKET === "true" || process.env.ENABLE_SYRIA_MARKET === "1",
  enableManualBookings: process.env.ENABLE_MANUAL_BOOKINGS !== "false",
  enableManualPayments: process.env.ENABLE_MANUAL_PAYMENTS !== "false",
  enableContactFirstUx: process.env.ENABLE_CONTACT_FIRST_UX !== "false",
  /** Draft/review UI and generators (distinct from publish kill switch). */
  enableAiContentEngine: process.env.ENABLE_AI_CONTENT_ENGINE !== "false",
  enableAiContentPublish: process.env.ENABLE_AI_CONTENT_PUBLISH === "true" || process.env.ENABLE_AI_CONTENT_PUBLISH === "1",
  enablePublicCityPages: process.env.ENABLE_PUBLIC_CITY_PAGES !== "false",
  enableMobileBookings: process.env.ENABLE_MOBILE_BOOKINGS !== "false",
} as const;

export type LaunchFlagKey = keyof typeof launchFlags;

/**
 * LECIPM Deployment Safety v1 — canonical names for ops / rollback docs.
 * Prefer explicit `FEATURE_ENABLE_*` env vars so Vercel toggles are obvious in incident response.
 * Values OR existing engine flags (see individual groups above).
 */
export const deploymentSafetyFlags = {
  /** Maps to user name `enable_new_pricing_engine` */
  enableNewPricingEngine:
    envTrue("FEATURE_ENABLE_NEW_PRICING_ENGINE") ||
    revenueV4Flags.monetizationEngineV1 ||
    revenueV4Flags.pricingEngineV2,

  /** Maps to `enable_ai_contracts_v2` */
  enableAiContractsV2:
    envTrue("FEATURE_ENABLE_AI_CONTRACTS_V2") ||
    dealExecutionFlags.contractIntelligenceV1 ||
    lecipmOaciqFlags.aiContractMapperV1,

  /** Maps to `enable_autopilot_actions` */
  enableAutopilotActions:
    envTrue("FEATURE_ENABLE_AUTOPILOT_ACTIONS") ||
    intelligenceFlags.autopilotV2 ||
    bnhubV2Flags.bnhubAutopilotV1 ||
    dealAutopilotFlags.smartDealAutopilotV1,

  /** Maps to `enable_experimental_features` */
  enableExperimentalFeatures:
    envTrue("FEATURE_ENABLE_EXPERIMENTAL_FEATURES") || growthV3Flags.experimentsAutoV1,
} as const;

export type DeploymentSafetyFlagKey = keyof typeof deploymentSafetyFlags;
