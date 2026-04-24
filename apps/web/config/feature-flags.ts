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
  /**
   * Explainable weighted marketplace ranking for listing search (relevance, price fit, quality, trust, …).
   * Env: `FEATURE_LISTING_MARKETPLACE_RANK_ALGO_V1`. Optional cohort: `RANKING_ALGO_COHORT`.
   */
  listingMarketplaceRankAlgorithmV1: envTrue("FEATURE_LISTING_MARKETPLACE_RANK_ALGO_V1"),
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
  coownershipVerificationEnforcement: envTrue("FEATURE_COOWNERSHIP_VERIFICATION_ENFORCEMENT"),
  coownershipExpiryEnforcement: envTrue("FEATURE_COOWNERSHIP_EXPIRY_ENFORCEMENT"),
  /**
   * LECIPM Growth Machine v1 — unified dashboard, lead capture API, reporting (default off).
   * Does not auto-send outreach; suggestions are review-only unless existing pipelines send.
   */
  growthMachineV1: envTrue("FEATURE_GROWTH_MACHINE_V1"),
  /** Growth Machine revenue panel v1 — read-only RevenueEvent + lead aggregates (`/api/growth/revenue`). */
  growthRevenuePanelV1: envTrue("FEATURE_GROWTH_REVENUE_PANEL_V1"),
  /** $1K/month growth plan — daily tasks + target progress (`/api/growth/1k-plan`). */
  growth1kPlanV1: envTrue("FEATURE_GROWTH_1K_PLAN_V1"),
  /**
   * Scale engine v1 — SEO landings, capture leads, nurture, social queue, `/dashboard/growth` metrics.
   * Default off; admin can still read `GET /api/admin/growth-scale-dashboard` when growth machine is on.
   */
  growthScaleEngineV1: envTrue("FEATURE_GROWTH_SCALE_ENGINE_V1"),
  /** Broker acquisition summary on Growth Machine (`/api/growth/broker-acquisition` + admin CRM link). */
  brokerAcquisitionV1: envTrue("FEATURE_BROKER_ACQUISITION_V1"),
  /** First 100 brokers — invite-only full SD access (transactions, docs, signatures). Default off. */
  earlyBrokerV1: envTrue("FEATURE_EARLY_BROKER_V1"),
  /** Draft-only ads copy + targeting for human export (no Meta/Google API). */
  adsEngineV1: envTrue("FEATURE_ADS_ENGINE_V1"),
  /** CRM lead → deal funnel summary + follow-up action hints (read-only / advisory). */
  funnelSystemV1: envTrue("FEATURE_FUNNEL_SYSTEM_V1"),
  /** Centris / broker-intake AI sales assistant — LECIPM-identified messages, broker escalations, logged timeline. */
  aiSalesAgentV1: envTrue("FEATURE_AI_SALES_AGENT_V1"),
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
  /** Fast Deal — measure sourcing / landing / playbook signals + outcomes (internal; no outreach automation). */
  fastDealResultsV1: envTrue("FEATURE_FAST_DEAL_RESULTS_V1"),
  /** Growth Machine dashboard panel for Fast Deal results loop (`FEATURE_FAST_DEAL_RESULTS_V1`). */
  fastDealResultsPanelV1: envTrue("FEATURE_FAST_DEAL_RESULTS_PANEL_V1"),
  /** Fast Deal city-by-city comparison engine (internal/admin). */
  fastDealCityComparisonV1: envTrue("FEATURE_FAST_DEAL_CITY_COMPARISON_V1"),
  /** Growth Machine panel for Fast Deal city comparison (`FEATURE_FAST_DEAL_CITY_COMPARISON_V1`). */
  fastDealCityComparisonPanelV1: envTrue("FEATURE_FAST_DEAL_CITY_COMPARISON_PANEL_V1"),
  /** Internal city playbook adaptation from Fast Deal comparison — guided suggestions only (`FEATURE_FAST_DEAL_CITY_COMPARISON_V1`). */
  cityPlaybookAdaptationV1: envTrue("FEATURE_CITY_PLAYBOOK_ADAPTATION_V1"),
  /** Growth Machine panel for city playbook adaptation (`FEATURE_CITY_PLAYBOOK_ADAPTATION_V1`). */
  cityPlaybookAdaptationPanelV1: envTrue("FEATURE_CITY_PLAYBOOK_ADAPTATION_PANEL_V1"),
  /** Measurement layer for AI assist / broker competition / scale panels — read-only aggregates (`FEATURE_GROWTH_*`). */
  growthExecutionResultsV1: envTrue("FEATURE_GROWTH_EXECUTION_RESULTS_V1"),
  /** Growth Machine panel for execution results summary (`FEATURE_GROWTH_EXECUTION_RESULTS_V1`). */
  growthExecutionResultsPanelV1: envTrue("FEATURE_GROWTH_EXECUTION_RESULTS_PANEL_V1"),
  /** Internal market expansion intelligence from city comparison (`FEATURE_FAST_DEAL_CITY_COMPARISON_V1`). */
  marketExpansionV1: envTrue("FEATURE_MARKET_EXPANSION_V1"),
  growthMarketExpansionPanelV1: envTrue("FEATURE_MARKET_EXPANSION_PANEL_V1"),
  weeklyReviewV1: envTrue("FEATURE_WEEKLY_REVIEW_V1"),
  growthWeeklyReviewPanelV1: envTrue("FEATURE_WEEKLY_REVIEW_PANEL_V1"),
  /**
   * Internal capital allocation engine — where to focus time/effort/budget (advisory; no money movement).
   * @see docs/growth/capital-allocation-engine.md
   */
  capitalAllocationV1: envTrue("FEATURE_CAPITAL_ALLOCATION_V1"),
  /** Growth Machine panel for capital allocation plan (`FEATURE_CAPITAL_ALLOCATION_V1`). */
  capitalAllocationPanelV1: envTrue("FEATURE_CAPITAL_ALLOCATION_PANEL_V1"),
  /** Approval-only execution planner — merges growth signals into Today / This week lists (`FEATURE_EXECUTION_PLANNER_V1`). */
  executionPlannerV1: envTrue("FEATURE_EXECUTION_PLANNER_V1"),
  /** Growth Machine panel for execution planner (`FEATURE_EXECUTION_PLANNER_V1`). */
  executionPlannerPanelV1: envTrue("FEATURE_EXECUTION_PLANNER_PANEL_V1"),
  /** Internal team coordination + assignments (`FEATURE_TEAM_COORDINATION_V1`). */
  teamCoordinationV1: envTrue("FEATURE_TEAM_COORDINATION_V1"),
  /** Growth Machine coordination panel (`FEATURE_TEAM_COORDINATION_V1`). */
  teamCoordinationPanelV1: envTrue("FEATURE_TEAM_COORDINATION_PANEL_V1"),
  /**
   * Internal execution accountability store (read-only tracking; in-memory; no automation).
   * @see docs/growth/execution-accountability-layer.md
   */
  executionAccountabilityV1: envTrue("FEATURE_EXECUTION_ACCOUNTABILITY_V1"),
  /** Growth Machine panel for shared execution accountability summary. */
  executionAccountabilityPanelV1: envTrue("FEATURE_EXECUTION_ACCOUNTABILITY_PANEL_V1"),
  /** Weekly team operating review API — internal leadership summary. */
  weeklyTeamReviewV1: envTrue("FEATURE_WEEKLY_TEAM_REVIEW_V1"),
  weeklyTeamReviewPanelV1: envTrue("FEATURE_WEEKLY_TEAM_REVIEW_PANEL_V1"),
  /** Revenue forecast illustration — CRM-based, advisory only. */
  revenueForecastV1: envTrue("FEATURE_REVENUE_FORECAST_V1"),
  revenueForecastPanelV1: envTrue("FEATURE_REVENUE_FORECAST_PANEL_V1"),
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
  /**
   * Listing preview uses full detector registry + full policy evaluate — still no execution (`DRY_RUN` only).
   * @see autonomousMarketplaceEngine.previewForListing
   */
  autonomyPreviewRealV1: envTrue("FEATURE_AUTONOMY_PREVIEW_REAL_V1"),
  /** Phase 6.5 — deterministic preview reasoning graph (signals → opportunities → policy → actions). Read-only. */
  autonomyExplainabilityV1: envTrue("FEATURE_AUTONOMY_EXPLAINABILITY_V1"),
  /**
   * Real read-only preview pipeline (metric signals → opportunities → policy → actions) — still DRY_RUN only.
   * @see buildPreviewSignalsForListing, AutonomousMarketplaceEngine.previewForWebFsboListing
   */
  autonomyRealPreviewV1: envTrue("FEATURE_AUTONOMY_REAL_PREVIEW_V1"),
  /**
   * Deterministic preview explainability graph (summary, findings, recommendations) — no LLM.
   * @see buildPreviewExplanation
   */
  autonomyPreviewExplainabilityV1: envTrue("FEATURE_AUTONOMY_PREVIEW_EXPLAINABILITY_V1"),
  /** Include policy rule codes and debug refs on reasoning nodes — admin-oriented. */
  autonomyExplainabilityDebugV1: envTrue("FEATURE_AUTONOMY_EXPLAINABILITY_DEBUG_V1"),
  /** Gate + audit path for autonomous actions (policy + governance + compliance; default off). */
  controlledExecutionV1: envTrue("FEATURE_CONTROLLED_EXECUTION_V1"),
  /** Admin approval queue for gated actions (pairs with controlled execution). */
  autonomyApprovalsV1: envTrue("FEATURE_AUTONOMY_APPROVALS_V1"),
  /** Region capability registry gates for controlled execution (`FEATURE_REGION_AWARE_AUTONOMY_V1` remains related). */
  regionAwareExecutionV1: envTrue("FEATURE_REGION_AWARE_EXECUTION_V1"),
  /** Syria listings: live controlled execution opt-in — preview stays available when false. */
  syriaLiveExecutionV1: envTrue("FEATURE_SYRIA_LIVE_EXECUTION_V1"),
  /** Post-exec rollback audit path for reversible internal actions (additive to hardening). */
  autonomyRollbackV1: envTrue("FEATURE_AUTONOMY_ROLLBACK_V1"),
  /** Verifies EXECUTED outcomes for internal-safe actions before optional rollback. */
  autonomyExecutionVerifyV1: envTrue("FEATURE_AUTONOMY_EXECUTION_VERIFY_V1"),
  /** Unified marketplace intelligence dashboard API (read-only aggregates). */
  marketplaceDashboardV1: envTrue("FEATURE_MARKETPLACE_DASHBOARD_V1"),
  /** Syria region read adapter — `syria_*` tables via shared `DATABASE_URL` (read-only; no merged Prisma schema). */
  syriaRegionAdapterV1: envTrue("FEATURE_SYRIA_REGION_ADAPTER_V1"),
  /** Stable `RegionListingRef` payloads in intelligence + previews (deterministic key format). */
  regionListingKeyV1: envTrue("FEATURE_REGION_LISTING_KEY_V1"),
  /** Syria listing preview via autonomous marketplace preview pipeline (DRY_RUN only). */
  syriaPreviewV1: envTrue("FEATURE_SYRIA_PREVIEW_V1"),
  /** Shared `@lecipm/platform-core` region registry + resolution (deterministic). */
  globalMultiRegionV1: envTrue("FEATURE_GLOBAL_MULTI_REGION_V1"),
  /** Admin global marketplace dashboard API + investor comparison surfaces. */
  globalDashboardV1: envTrue("FEATURE_GLOBAL_DASHBOARD_V1"),
  /** Explicit regional adapter registry (`ca_qc`, `sy`) for intelligence aggregation. */
  regionAdaptersV1: envTrue("FEATURE_REGION_ADAPTERS_V1"),
  /** Gate autonomy / controlled execution by region capability + jurisdiction pack. */
  regionAwareAutonomyV1: envTrue("FEATURE_REGION_AWARE_AUTONOMY_V1"),
  /** Cross-region advisory domination summary (pairs with existing market domination intelligence). */
  globalDominationV1: envTrue("FEATURE_GLOBAL_DOMINATION_V1"),
  /** Phase 8 — legal risk + trust dampening/boost for marketplace ordering (deterministic). */
  legalTrustRankingV1: envTrue("FEATURE_LEGAL_TRUST_RANKING_V1"),
  /** Post-exec verification + rollback hooks for reversible internal actions only. */
  autopilotHardeningV1: envTrue("FEATURE_AUTOPILOT_HARDENING_V1"),
  /** Advisory domination / ranking–pricing surface (deterministic explainers). */
  marketDominationV1: envTrue("FEATURE_MARKET_DOMINATION_V1"),
  /** Single-pane unified listing intelligence read model + admin APIs (read-only aggregates). Default off. */
  unifiedIntelligenceV1: envTrue("FEATURE_UNIFIED_INTELLIGENCE_V1"),
  /** Investor pitch V1 — static narrative slides (review before external use). */
  investorPitchV1: envTrue("FEATURE_INVESTOR_PITCH_V1"),
  /** Auto-generated investor dashboard API — CRM + growth signals only (`FEATURE_INVESTOR_DASHBOARD_V1`). */
  investorDashboardV1: envTrue("FEATURE_INVESTOR_DASHBOARD_V1"),
  /** Growth Machine investor dashboard panel (pairs with investor dashboard API). */
  investorDashboardPanelV1: envTrue("FEATURE_INVESTOR_DASHBOARD_PANEL_V1"),
  /** Secure read-only investor share links — create/list/revoke API (pairs with investor dashboard). */
  investorShareLinkV1: envTrue("FEATURE_INVESTOR_SHARE_LINK_V1"),
  /** Internal Growth Machine panel to manage investor share links. */
  investorSharePanelV1: envTrue("FEATURE_INVESTOR_SHARE_PANEL_V1"),
  /** Public `/investor/share/[token]` read-only dashboard route. */
  investorSharePublicV1: envTrue("FEATURE_INVESTOR_SHARE_PUBLIC_V1"),
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
  /** Map policy findings to safe navigation + resolution copy (read-only; no auto-exec). */
  growthPolicyActionsV1: envTrue("FEATURE_GROWTH_POLICY_ACTIONS_V1"),
  /** Growth policy panel: top action + open/review affordances. */
  growthPolicyActionsPanelV1: envTrue("FEATURE_GROWTH_POLICY_ACTIONS_PANEL_V1"),
  /** Policy evaluation fingerprint history + hints (additive JSON store; default off). */
  growthPolicyHistoryV1: envTrue("FEATURE_GROWTH_POLICY_HISTORY_V1"),
  /** Dashboard panel for recurring findings + history table (default off). */
  growthPolicyHistoryPanelV1: envTrue("FEATURE_GROWTH_POLICY_HISTORY_PANEL_V1"),
  /** POST review records + review form UI (default off). */
  growthPolicyReviewV1: envTrue("FEATURE_GROWTH_POLICY_REVIEW_V1"),
  /** Policy safety trend rollups from daily snapshots (read-only; default off). */
  growthPolicyTrendsV1: envTrue("FEATURE_GROWTH_POLICY_TRENDS_V1"),
  /** Growth machine panel for policy trend summary (default off). */
  growthPolicyTrendsPanelV1: envTrue("FEATURE_GROWTH_POLICY_TRENDS_PANEL_V1"),
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
  /** Journey outcome analytics (banner/copilot/blocker beacons — server logs only; default off). */
  hubJourneyAnalyticsV1: envTrue("FEATURE_HUB_JOURNEY_ANALYTICS_V1"),
  /** Admin journey effectiveness dashboard + APIs (aggregated read-only). */
  hubJourneyAnalyticsDashboardV1: envTrue("FEATURE_HUB_JOURNEY_ANALYTICS_DASHBOARD_V1"),
  /** Journey→outcome attribution summaries (exploratory; default off). */
  hubJourneyAttributionV1: envTrue("FEATURE_HUB_JOURNEY_ATTRIBUTION_V1"),
  /** Copilot/step feedback capture (bounded signals only; default off). */
  hubJourneyFeedbackV1: envTrue("FEATURE_HUB_JOURNEY_FEEDBACK_V1"),
  /** Unified adaptive growth suggestions API (read-only, approval-based; no auto-exec). */
  adaptiveIntelligenceV1: envTrue("FEATURE_ADAPTIVE_INTELLIGENCE_V1"),
  /** Growth Machine panel for adaptive intelligence (requires API flag). */
  adaptiveIntelligencePanelV1: envTrue("FEATURE_ADAPTIVE_INTELLIGENCE_PANEL_V1"),
  /** Scenario-based action simulation API (read-only; no execution). */
  actionSimulationV1: envTrue("FEATURE_ACTION_SIMULATION_V1"),
  /** Growth Machine panel for action simulation + comparison UI. */
  actionSimulationPanelV1: envTrue("FEATURE_ACTION_SIMULATION_PANEL_V1"),
  /** Allow A/B comparison of two simulated actions in UI + API. */
  actionSimulationComparisonV1: envTrue("FEATURE_ACTION_SIMULATION_COMPARISON_V1"),
  /**
   * When true, `/[locale]/[country]/dashboard` redirects to `/dashboard/lecipm` unless the user chose Classic (cookie).
   * Env: `FEATURE_LECIPM_CONSOLE_DEFAULT`
   */
  lecipmConsoleDefault: envTrue("FEATURE_LECIPM_CONSOLE_DEFAULT"),
} as const;

/** @see engineFlags.lecipmConsoleDefault */
export const FEATURE_LECIPM_CONSOLE_DEFAULT = engineFlags.lecipmConsoleDefault;

/** @see engineFlags.listingMarketplaceRankAlgorithmV1 */
export const FEATURE_LISTING_MARKETPLACE_RANK_ALGO_V1 =
  engineFlags.listingMarketplaceRankAlgorithmV1;

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
  /** Operator-tracked flywheel actions + baseline snapshots (admin only). */
  marketplaceFlywheelActionsV1: envTrue("FEATURE_MARKETPLACE_FLYWHEEL_ACTIONS_V1"),
  /** Persisted outcome evaluations vs baseline metrics (admin only). */
  marketplaceFlywheelOutcomesV1: envTrue("FEATURE_MARKETPLACE_FLYWHEEL_OUTCOMES_V1"),
  /** Evidence-based growth action suggestions (read-only; no auto-execution). */
  marketplaceFlywheelAutoSuggestV1: envTrue("FEATURE_MARKETPLACE_FLYWHEEL_AUTO_SUGGEST_V1"),
  marketplaceFlywheelAutoSuggestPanelV1: envTrue("FEATURE_MARKETPLACE_FLYWHEEL_AUTO_SUGGEST_PANEL_V1"),
} as const;

export type MarketplaceFlywheelFlagKey = keyof typeof marketplaceFlywheelFlags;

/** @see marketplaceFlywheelFlags.marketplaceFlywheelV1 */
export const FEATURE_MARKETPLACE_FLYWHEEL_V1 = marketplaceFlywheelFlags.marketplaceFlywheelV1;

/** @see marketplaceFlywheelFlags.marketplaceFlywheelActionsV1 */
export const FEATURE_MARKETPLACE_FLYWHEEL_ACTIONS_V1 = marketplaceFlywheelFlags.marketplaceFlywheelActionsV1;

/** @see marketplaceFlywheelFlags.marketplaceFlywheelOutcomesV1 */
export const FEATURE_MARKETPLACE_FLYWHEEL_OUTCOMES_V1 = marketplaceFlywheelFlags.marketplaceFlywheelOutcomesV1;

/** @see marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestV1 */
export const FEATURE_MARKETPLACE_FLYWHEEL_AUTO_SUGGEST_V1 = marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestV1;

/** @see marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestPanelV1 */
export const FEATURE_MARKETPLACE_FLYWHEEL_AUTO_SUGGEST_PANEL_V1 =
  marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestPanelV1;

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
 * Growth Intelligence Phase 6 — deterministic signals, draft briefs, prioritized opportunities (default off).
 */
export const growthIntelligenceFlags = {
  growthIntelligenceV1: envTrue("FEATURE_GROWTH_INTELLIGENCE_V1"),
  growthBriefsV1: envTrue("FEATURE_GROWTH_BRIEFS_V1"),
  growthOpportunitiesV1: envTrue("FEATURE_GROWTH_OPPORTUNITIES_V1"),
} as const;

export type GrowthIntelligenceFlagKey = keyof typeof growthIntelligenceFlags;

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
 * Growth autonomy framework — OFF / ASSIST / SAFE_AUTOPILOT orchestration (advisory-only; default off).
 * Does not control payments, bookings core, ads core, or CRO core. Pair with policy enforcement for production.
 */
export const growthAutonomyFlags = {
  growthAutonomyV1: envTrue("FEATURE_GROWTH_AUTONOMY_V1"),
  growthAutonomyPanelV1: envTrue("FEATURE_GROWTH_AUTONOMY_PANEL_V1"),
  growthAutonomyKillSwitch: envTrue("FEATURE_GROWTH_AUTONOMY_KILL_SWITCH"),
  /** Bounded prioritization from observed operator behavior — advisory-only; independently disableable. */
  growthAutonomyLearningV1: envTrue("FEATURE_GROWTH_AUTONOMY_LEARNING_V1"),
  growthAutonomyLearningPanelV1: envTrue("FEATURE_GROWTH_AUTONOMY_LEARNING_PANEL_V1"),
  /**
   * Allowlisted low-risk internal auto-execution (separate env rollout) — does not include payments, external sends, or core product state.
   * Never bypasses policy; must be used with FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_ROLLOUT.
   */
  growthAutonomyAutoLowRiskV1: envTrue("FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_V1"),
  growthAutonomyAutoLowRiskPanelV1: envTrue("FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_PANEL_V1"),
  /** Evidence-based adjacent low-risk expansion proposals — manual approval only; never widens risky domains. */
  growthAutonomyExpansionV1: envTrue("FEATURE_GROWTH_AUTONOMY_EXPANSION_V1"),
  growthAutonomyExpansionPanelV1: envTrue("FEATURE_GROWTH_AUTONOMY_EXPANSION_PANEL_V1"),
  /** When on, blocks new expansion trial activations (read-only evaluation may continue). */
  growthAutonomyExpansionFreeze: envTrue("FEATURE_GROWTH_AUTONOMY_EXPANSION_FREEZE"),
  /**
   * Single adjacent internal low-risk trial — operator-approved only; internal rollout; reversible audit artifact.
   * Independent from expansion proposals.
   */
  growthAutonomyTrialV1: envTrue("FEATURE_GROWTH_AUTONOMY_TRIAL_V1"),
  growthAutonomyTrialPanelV1: envTrue("FEATURE_GROWTH_AUTONOMY_TRIAL_PANEL_V1"),
  /** Blocks new trial approvals/activations while allowing read-only visibility of prior state. */
  growthAutonomyTrialFreeze: envTrue("FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE"),
} as const;

export type GrowthAutonomyFlagKey = keyof typeof growthAutonomyFlags;

export const FEATURE_GROWTH_AUTONOMY_V1 = growthAutonomyFlags.growthAutonomyV1;
export const FEATURE_GROWTH_AUTONOMY_PANEL_V1 = growthAutonomyFlags.growthAutonomyPanelV1;
export const FEATURE_GROWTH_AUTONOMY_KILL_SWITCH = growthAutonomyFlags.growthAutonomyKillSwitch;
export const FEATURE_GROWTH_AUTONOMY_LEARNING_V1 = growthAutonomyFlags.growthAutonomyLearningV1;
export const FEATURE_GROWTH_AUTONOMY_LEARNING_PANEL_V1 = growthAutonomyFlags.growthAutonomyLearningPanelV1;
export const FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_V1 = growthAutonomyFlags.growthAutonomyAutoLowRiskV1;
export const FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_PANEL_V1 = growthAutonomyFlags.growthAutonomyAutoLowRiskPanelV1;
export const FEATURE_GROWTH_AUTONOMY_EXPANSION_V1 = growthAutonomyFlags.growthAutonomyExpansionV1;
export const FEATURE_GROWTH_AUTONOMY_EXPANSION_PANEL_V1 = growthAutonomyFlags.growthAutonomyExpansionPanelV1;
export const FEATURE_GROWTH_AUTONOMY_EXPANSION_FREEZE = growthAutonomyFlags.growthAutonomyExpansionFreeze;
export const FEATURE_GROWTH_AUTONOMY_TRIAL_V1 = growthAutonomyFlags.growthAutonomyTrialV1;
export const FEATURE_GROWTH_AUTONOMY_TRIAL_PANEL_V1 = growthAutonomyFlags.growthAutonomyTrialPanelV1;
export const FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE = growthAutonomyFlags.growthAutonomyTrialFreeze;

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
  /** Focused operator session (guidance + progress, no autopilot) — default off. */
  growthMissionSessionV1: envTrue("FEATURE_GROWTH_MISSION_SESSION_V1"),
  growthMissionSessionPanelV1: envTrue("FEATURE_GROWTH_MISSION_SESSION_PANEL_V1"),
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
 * Ops assistant — approval-based execution & panel (default off). Kill switch blocks execution even when execution flag is on.
 */
export const opsAssistantApprovalFlags = {
  opsAssistantApprovalExecutionV1: envTrue("FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1"),
  opsAssistantApprovalPanelV1: envTrue("FEATURE_OPS_ASSISTANT_APPROVAL_PANEL_V1"),
  opsAssistantApprovalKillSwitch: envTrue("FEATURE_OPS_ASSISTANT_APPROVAL_KILL_SWITCH"),
} as const;

export type OpsAssistantApprovalFlagKey = keyof typeof opsAssistantApprovalFlags;

/** @see opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1 */
export const FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1 =
  opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1;

/** @see opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 */
export const FEATURE_OPS_ASSISTANT_APPROVAL_PANEL_V1 = opsAssistantApprovalFlags.opsAssistantApprovalPanelV1;

/** @see opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch */
export const FEATURE_OPS_ASSISTANT_APPROVAL_KILL_SWITCH =
  opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch;

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
 * Internal lead pricing experiments + operator override records (admin only; advisory; default off).
 */
export const leadPricingExperimentsFlags = {
  leadPricingExperimentsV1: envTrue("FEATURE_LEAD_PRICING_EXPERIMENTS_V1"),
} as const;

export type LeadPricingExperimentsFlagKey = keyof typeof leadPricingExperimentsFlags;

/** @see leadPricingExperimentsFlags.leadPricingExperimentsV1 */
export const FEATURE_LEAD_PRICING_EXPERIMENTS_V1 = leadPricingExperimentsFlags.leadPricingExperimentsV1;

export const leadPricingOverrideFlags = {
  leadPricingOverrideV1: envTrue("FEATURE_LEAD_PRICING_OVERRIDE_V1"),
  leadPricingOverridePanelV1: envTrue("FEATURE_LEAD_PRICING_OVERRIDE_PANEL_V1"),
} as const;

export type LeadPricingOverrideFlagKey = keyof typeof leadPricingOverrideFlags;

/** @see leadPricingOverrideFlags.leadPricingOverrideV1 */
export const FEATURE_LEAD_PRICING_OVERRIDE_V1 = leadPricingOverrideFlags.leadPricingOverrideV1;

/** @see leadPricingOverrideFlags.leadPricingOverridePanelV1 */
export const FEATURE_LEAD_PRICING_OVERRIDE_PANEL_V1 = leadPricingOverrideFlags.leadPricingOverridePanelV1;

/**
 * Lead pricing results measurement (observations + internal outcome readouts) — admin only; no payment changes.
 */
export const leadPricingResultsFlags = {
  leadPricingResultsV1: envTrue("FEATURE_LEAD_PRICING_RESULTS_V1"),
  leadPricingResultsPanelV1: envTrue("FEATURE_LEAD_PRICING_RESULTS_PANEL_V1"),
} as const;

export type LeadPricingResultsFlagKey = keyof typeof leadPricingResultsFlags;

/** @see leadPricingResultsFlags.leadPricingResultsV1 */
export const FEATURE_LEAD_PRICING_RESULTS_V1 = leadPricingResultsFlags.leadPricingResultsV1;

/** @see leadPricingResultsFlags.leadPricingResultsPanelV1 */
export const FEATURE_LEAD_PRICING_RESULTS_PANEL_V1 = leadPricingResultsFlags.leadPricingResultsPanelV1;

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
 * Broker performance panel on broker hub — constructive self-view (default off; requires performance V1 for data).
 */
export const brokerPerformancePanelFlags = {
  brokerPerformancePanelV1: envTrue("FEATURE_BROKER_PERFORMANCE_PANEL_V1"),
} as const;

export type BrokerPerformancePanelFlagKey = keyof typeof brokerPerformancePanelFlags;

/** @see brokerPerformancePanelFlags.brokerPerformancePanelV1 */
export const FEATURE_BROKER_PERFORMANCE_PANEL_V1 = brokerPerformancePanelFlags.brokerPerformancePanelV1;

/**
 * Growth Engine V2 — unified internal operating snapshot + admin panel (default off).
 */
export const growthEngineV2Flags = {
  growthEngineV2: envTrue("FEATURE_GROWTH_ENGINE_V2"),
  growthEngineV2Panel: envTrue("FEATURE_GROWTH_ENGINE_V2_PANEL"),
} as const;

export type GrowthEngineV2FlagKey = keyof typeof growthEngineV2Flags;

/** @see growthEngineV2Flags.growthEngineV2 */
export const FEATURE_GROWTH_ENGINE_V2 = growthEngineV2Flags.growthEngineV2;

/** @see growthEngineV2Flags.growthEngineV2Panel */
export const FEATURE_GROWTH_ENGINE_V2_PANEL = growthEngineV2Flags.growthEngineV2Panel;

/**
 * Broker incentives V1 — recognition, streaks, milestones (no money; default off).
 */
export const brokerIncentivesFlags = {
  brokerIncentivesV1: envTrue("FEATURE_BROKER_INCENTIVES_V1"),
} as const;

export type BrokerIncentivesFlagKey = keyof typeof brokerIncentivesFlags;

/** @see brokerIncentivesFlags.brokerIncentivesV1 */
export const FEATURE_BROKER_INCENTIVES_V1 = brokerIncentivesFlags.brokerIncentivesV1;

/**
 * Broker incentives panel on broker hub — recognition UI (default off; requires incentives V1 for data).
 */
export const brokerIncentivesPanelFlags = {
  brokerIncentivesPanelV1: envTrue("FEATURE_BROKER_INCENTIVES_PANEL_V1"),
} as const;

export type BrokerIncentivesPanelFlagKey = keyof typeof brokerIncentivesPanelFlags;

/** @see brokerIncentivesPanelFlags.brokerIncentivesPanelV1 */
export const FEATURE_BROKER_INCENTIVES_PANEL_V1 = brokerIncentivesPanelFlags.brokerIncentivesPanelV1;

/**
 * Broker AI assist — advisory suggestions + draft angles (requires closing V1; default off).
 */
export const brokerAiAssistFlags = {
  brokerAiAssistV1: envTrue("FEATURE_BROKER_AI_ASSIST_V1"),
} as const;

/** Broker manager / team dashboard — internal coaching visibility only (default off). */
export const brokerTeamViewFlags = {
  brokerTeamViewV1: envTrue("FEATURE_BROKER_TEAM_VIEW_V1"),
} as const;

export type BrokerTeamViewFlagKey = keyof typeof brokerTeamViewFlags;

/** @see brokerTeamViewFlags.brokerTeamViewV1 */
export const FEATURE_BROKER_TEAM_VIEW_V1 = brokerTeamViewFlags.brokerTeamViewV1;

/**
 * Admin broker team coaching dashboard UI (default off; requires team view V1 for data).
 */
export const brokerTeamViewPanelFlags = {
  brokerTeamViewPanelV1: envTrue("FEATURE_BROKER_TEAM_VIEW_PANEL_V1"),
} as const;

export type BrokerTeamViewPanelFlagKey = keyof typeof brokerTeamViewPanelFlags;

/** @see brokerTeamViewPanelFlags.brokerTeamViewPanelV1 */
export const FEATURE_BROKER_TEAM_VIEW_PANEL_V1 = brokerTeamViewPanelFlags.brokerTeamViewPanelV1;

export type BrokerAiAssistFlagKey = keyof typeof brokerAiAssistFlags;

/** @see brokerAiAssistFlags.brokerAiAssistV1 */
export const FEATURE_BROKER_AI_ASSIST_V1 = brokerAiAssistFlags.brokerAiAssistV1;

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
 * Lead distribution AI — fair explainable routing + admin assignment audit (default off).
 */
export const brokerLeadDistributionFlags = {
  brokerLeadDistributionV1: envTrue("FEATURE_BROKER_LEAD_DISTRIBUTION_V1"),
  brokerLeadDistributionPanelV1: envTrue("FEATURE_BROKER_LEAD_DISTRIBUTION_PANEL_V1"),
  /** Future: gated internal auto-route only — reserved; does not execute in V1 UI. */
  brokerLeadDistributionAutoInternalV1: envTrue("FEATURE_BROKER_LEAD_DISTRIBUTION_AUTO_INTERNAL_V1"),
} as const;

export type BrokerLeadDistributionFlagKey = keyof typeof brokerLeadDistributionFlags;

/** @see brokerLeadDistributionFlags.brokerLeadDistributionV1 */
export const FEATURE_BROKER_LEAD_DISTRIBUTION_V1 = brokerLeadDistributionFlags.brokerLeadDistributionV1;

/** @see brokerLeadDistributionFlags.brokerLeadDistributionPanelV1 */
export const FEATURE_BROKER_LEAD_DISTRIBUTION_PANEL_V1 =
  brokerLeadDistributionFlags.brokerLeadDistributionPanelV1;

/** @see brokerLeadDistributionFlags.brokerLeadDistributionAutoInternalV1 */
export const FEATURE_BROKER_LEAD_DISTRIBUTION_AUTO_INTERNAL_V1 =
  brokerLeadDistributionFlags.brokerLeadDistributionAutoInternalV1;

/**
 * Broker service areas + specialization profiles — explicit JSON persistence (default off).
 */
export const brokerServiceProfileFlags = {
  brokerServiceProfileV1: envTrue("FEATURE_BROKER_SERVICE_PROFILE_V1"),
  brokerServiceProfilePanelV1: envTrue("FEATURE_BROKER_SERVICE_PROFILE_PANEL_V1"),
  brokerSpecializationRoutingV1: envTrue("FEATURE_BROKER_SPECIALIZATION_ROUTING_V1"),
} as const;

/** Availability / capacity / SLA soft routing — additive; default off. */
export const brokerAvailabilityRoutingFlags = {
  brokerAvailabilityRoutingV1: envTrue("FEATURE_BROKER_AVAILABILITY_ROUTING_V1"),
  brokerCapacityRoutingV1: envTrue("FEATURE_BROKER_CAPACITY_ROUTING_V1"),
  brokerSlaRoutingV1: envTrue("FEATURE_BROKER_SLA_ROUTING_V1"),
} as const;

export type BrokerAvailabilityRoutingFlagKey = keyof typeof brokerAvailabilityRoutingFlags;

/** @see brokerAvailabilityRoutingFlags.brokerAvailabilityRoutingV1 */
export const FEATURE_BROKER_AVAILABILITY_ROUTING_V1 = brokerAvailabilityRoutingFlags.brokerAvailabilityRoutingV1;
/** @see brokerAvailabilityRoutingFlags.brokerCapacityRoutingV1 */
export const FEATURE_BROKER_CAPACITY_ROUTING_V1 = brokerAvailabilityRoutingFlags.brokerCapacityRoutingV1;
/** @see brokerAvailabilityRoutingFlags.brokerSlaRoutingV1 */
export const FEATURE_BROKER_SLA_ROUTING_V1 = brokerAvailabilityRoutingFlags.brokerSlaRoutingV1;

export type BrokerServiceProfileFlagKey = keyof typeof brokerServiceProfileFlags;

/** @see brokerServiceProfileFlags.brokerServiceProfileV1 */
export const FEATURE_BROKER_SERVICE_PROFILE_V1 = brokerServiceProfileFlags.brokerServiceProfileV1;

/** @see brokerServiceProfileFlags.brokerServiceProfilePanelV1 */
export const FEATURE_BROKER_SERVICE_PROFILE_PANEL_V1 = brokerServiceProfileFlags.brokerServiceProfilePanelV1;

/** @see brokerServiceProfileFlags.brokerSpecializationRoutingV1 */
export const FEATURE_BROKER_SPECIALIZATION_ROUTING_V1 = brokerServiceProfileFlags.brokerSpecializationRoutingV1;

/**
 * Lead enrichment + geo routing — defaults ON unless explicitly disabled (`false` / `0`).
 * Strict same-city prioritization remains OFF unless `FEATURE_STRICT_GEO_ROUTING_V1=true`.
 */
export const leadGeoRoutingFlags = {
  leadEnrichmentV1:
    process.env.FEATURE_LEAD_ENRICHMENT_V1 !== "false" && process.env.FEATURE_LEAD_ENRICHMENT_V1 !== "0",
  geoRoutingV1: process.env.FEATURE_GEO_ROUTING_V1 !== "false" && process.env.FEATURE_GEO_ROUTING_V1 !== "0",
  strictGeoRoutingV1: envTrue("FEATURE_STRICT_GEO_ROUTING_V1"),
} as const;

export type LeadGeoRoutingFlagKey = keyof typeof leadGeoRoutingFlags;

/** @see leadGeoRoutingFlags.leadEnrichmentV1 */
export const FEATURE_LEAD_ENRICHMENT_V1 = leadGeoRoutingFlags.leadEnrichmentV1;
/** @see leadGeoRoutingFlags.geoRoutingV1 */
export const FEATURE_GEO_ROUTING_V1 = leadGeoRoutingFlags.geoRoutingV1;
/** @see leadGeoRoutingFlags.strictGeoRoutingV1 */
export const FEATURE_STRICT_GEO_ROUTING_V1 = leadGeoRoutingFlags.strictGeoRoutingV1;

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
/** @see engineFlags.fastDealResultsV1 */
export const FEATURE_FAST_DEAL_RESULTS_V1 = engineFlags.fastDealResultsV1;
/** @see engineFlags.fastDealResultsPanelV1 */
export const FEATURE_FAST_DEAL_RESULTS_PANEL_V1 = engineFlags.fastDealResultsPanelV1;
/** @see engineFlags.fastDealCityComparisonV1 */
export const FEATURE_FAST_DEAL_CITY_COMPARISON_V1 = engineFlags.fastDealCityComparisonV1;
/** @see engineFlags.fastDealCityComparisonPanelV1 */
export const FEATURE_FAST_DEAL_CITY_COMPARISON_PANEL_V1 = engineFlags.fastDealCityComparisonPanelV1;
/** @see engineFlags.cityPlaybookAdaptationV1 */
export const FEATURE_CITY_PLAYBOOK_ADAPTATION_V1 = engineFlags.cityPlaybookAdaptationV1;
/** @see engineFlags.cityPlaybookAdaptationPanelV1 */
export const FEATURE_CITY_PLAYBOOK_ADAPTATION_PANEL_V1 = engineFlags.cityPlaybookAdaptationPanelV1;
/** @see engineFlags.growthExecutionResultsV1 */
export const FEATURE_GROWTH_EXECUTION_RESULTS_V1 = engineFlags.growthExecutionResultsV1;
/** @see engineFlags.growthExecutionResultsPanelV1 */
export const FEATURE_GROWTH_EXECUTION_RESULTS_PANEL_V1 = engineFlags.growthExecutionResultsPanelV1;
/** @see engineFlags.marketExpansionV1 */
export const FEATURE_MARKET_EXPANSION_V1 = engineFlags.marketExpansionV1;
/** @see engineFlags.growthMarketExpansionPanelV1 */
export const FEATURE_MARKET_EXPANSION_PANEL_V1 = engineFlags.growthMarketExpansionPanelV1;
/** @see engineFlags.weeklyReviewV1 */
export const FEATURE_WEEKLY_REVIEW_V1 = engineFlags.weeklyReviewV1;
/** @see engineFlags.growthWeeklyReviewPanelV1 */
export const FEATURE_WEEKLY_REVIEW_PANEL_V1 = engineFlags.growthWeeklyReviewPanelV1;
/** @see engineFlags.capitalAllocationV1 */
export const FEATURE_CAPITAL_ALLOCATION_V1 = engineFlags.capitalAllocationV1;
/** @see engineFlags.capitalAllocationPanelV1 */
export const FEATURE_CAPITAL_ALLOCATION_PANEL_V1 = engineFlags.capitalAllocationPanelV1;
/** @see engineFlags.executionPlannerV1 */
export const FEATURE_EXECUTION_PLANNER_V1 = engineFlags.executionPlannerV1;
/** @see engineFlags.executionPlannerPanelV1 */
export const FEATURE_EXECUTION_PLANNER_PANEL_V1 = engineFlags.executionPlannerPanelV1;
/** @see engineFlags.teamCoordinationV1 */
export const FEATURE_TEAM_COORDINATION_V1 = engineFlags.teamCoordinationV1;
/** @see engineFlags.teamCoordinationPanelV1 */
export const FEATURE_TEAM_COORDINATION_PANEL_V1 = engineFlags.teamCoordinationPanelV1;
/** @see engineFlags.executionAccountabilityV1 */
export const FEATURE_EXECUTION_ACCOUNTABILITY_V1 = engineFlags.executionAccountabilityV1;
/** @see engineFlags.executionAccountabilityPanelV1 */
export const FEATURE_EXECUTION_ACCOUNTABILITY_PANEL_V1 = engineFlags.executionAccountabilityPanelV1;
/** @see engineFlags.weeklyTeamReviewV1 */
export const FEATURE_WEEKLY_TEAM_REVIEW_V1 = engineFlags.weeklyTeamReviewV1;
/** @see engineFlags.weeklyTeamReviewPanelV1 */
export const FEATURE_WEEKLY_TEAM_REVIEW_PANEL_V1 = engineFlags.weeklyTeamReviewPanelV1;
/** @see engineFlags.revenueForecastV1 */
export const FEATURE_REVENUE_FORECAST_V1 = engineFlags.revenueForecastV1;
/** @see engineFlags.revenueForecastPanelV1 */
export const FEATURE_REVENUE_FORECAST_PANEL_V1 = engineFlags.revenueForecastPanelV1;
export const FEATURE_LEAD_FOLLOWUP_V1 = engineFlags.leadFollowupV1;
export const FEATURE_BROKER_CLOSING_ADVANCED_V1 = engineFlags.brokerClosingAdvancedV1;
export const FEATURE_SCALING_BLUEPRINT_V1 = engineFlags.scalingBlueprintV1;
export const FEATURE_AI_ASSIST_EXECUTION_V1 = engineFlags.aiAssistExecutionV1;
export const FEATURE_BROKER_COMPETITION_V1 = engineFlags.brokerCompetitionV1;
export const FEATURE_SCALE_SYSTEM_V1 = engineFlags.scaleSystemV1;
export const FEATURE_AUTONOMOUS_MARKETPLACE_V1 = engineFlags.autonomousMarketplaceV1;
/** @see engineFlags.autonomyPreviewRealV1 */
export const FEATURE_AUTONOMY_PREVIEW_REAL_V1 = engineFlags.autonomyPreviewRealV1;
/** @see engineFlags.autonomyExplainabilityV1 */
export const FEATURE_AUTONOMY_EXPLAINABILITY_V1 = engineFlags.autonomyExplainabilityV1;
/** @see engineFlags.autonomyExplainabilityDebugV1 */
export const FEATURE_AUTONOMY_EXPLAINABILITY_DEBUG_V1 = engineFlags.autonomyExplainabilityDebugV1;
/** @see engineFlags.autonomyRealPreviewV1 */
export const FEATURE_AUTONOMY_REAL_PREVIEW_V1 = engineFlags.autonomyRealPreviewV1;
/** @see engineFlags.autonomyPreviewExplainabilityV1 */
export const FEATURE_AUTONOMY_PREVIEW_EXPLAINABILITY_V1 = engineFlags.autonomyPreviewExplainabilityV1;
export const FEATURE_INVESTOR_PITCH_V1 = engineFlags.investorPitchV1;
/** @see engineFlags.investorDashboardV1 */
export const FEATURE_INVESTOR_DASHBOARD_V1 = engineFlags.investorDashboardV1;
/** @see engineFlags.investorDashboardPanelV1 */
export const FEATURE_INVESTOR_DASHBOARD_PANEL_V1 = engineFlags.investorDashboardPanelV1;
/** @see engineFlags.investorShareLinkV1 */
export const FEATURE_INVESTOR_SHARE_LINK_V1 = engineFlags.investorShareLinkV1;
/** @see engineFlags.investorSharePanelV1 */
export const FEATURE_INVESTOR_SHARE_PANEL_V1 = engineFlags.investorSharePanelV1;
/** @see engineFlags.investorSharePublicV1 */
export const FEATURE_INVESTOR_SHARE_PUBLIC_V1 = engineFlags.investorSharePublicV1;
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
/** @see engineFlags.growthPolicyActionsV1 */
export const FEATURE_GROWTH_POLICY_ACTIONS_V1 = engineFlags.growthPolicyActionsV1;
/** @see engineFlags.growthPolicyActionsPanelV1 */
export const FEATURE_GROWTH_POLICY_ACTIONS_PANEL_V1 = engineFlags.growthPolicyActionsPanelV1;
/** @see engineFlags.growthPolicyHistoryV1 */
export const FEATURE_GROWTH_POLICY_HISTORY_V1 = engineFlags.growthPolicyHistoryV1;
/** @see engineFlags.growthPolicyHistoryPanelV1 */
export const FEATURE_GROWTH_POLICY_HISTORY_PANEL_V1 = engineFlags.growthPolicyHistoryPanelV1;
/** @see engineFlags.growthPolicyReviewV1 */
export const FEATURE_GROWTH_POLICY_REVIEW_V1 = engineFlags.growthPolicyReviewV1;
/** @see engineFlags.growthPolicyTrendsV1 */
export const FEATURE_GROWTH_POLICY_TRENDS_V1 = engineFlags.growthPolicyTrendsV1;
/** @see engineFlags.growthPolicyTrendsPanelV1 */
export const FEATURE_GROWTH_POLICY_TRENDS_PANEL_V1 = engineFlags.growthPolicyTrendsPanelV1;
export const FEATURE_HUB_JOURNEY_V1 = engineFlags.hubJourneyV1;
export const FEATURE_HUB_COPILOT_V1 = engineFlags.hubCopilotV1;
/** @see engineFlags.hubJourneyAnalyticsV1 */
export const FEATURE_HUB_JOURNEY_ANALYTICS_V1 = engineFlags.hubJourneyAnalyticsV1;
/** @see engineFlags.hubJourneyAnalyticsDashboardV1 */
export const FEATURE_HUB_JOURNEY_ANALYTICS_DASHBOARD_V1 = engineFlags.hubJourneyAnalyticsDashboardV1;
/** @see engineFlags.hubJourneyAttributionV1 */
export const FEATURE_HUB_JOURNEY_ATTRIBUTION_V1 = engineFlags.hubJourneyAttributionV1;
/** @see engineFlags.hubJourneyFeedbackV1 */
export const FEATURE_HUB_JOURNEY_FEEDBACK_V1 = engineFlags.hubJourneyFeedbackV1;
/** @see engineFlags.adaptiveIntelligenceV1 */
export const FEATURE_ADAPTIVE_INTELLIGENCE_V1 = engineFlags.adaptiveIntelligenceV1;
/** @see engineFlags.adaptiveIntelligencePanelV1 */
export const FEATURE_ADAPTIVE_INTELLIGENCE_PANEL_V1 = engineFlags.adaptiveIntelligencePanelV1;

/** @see engineFlags.actionSimulationV1 */
export const FEATURE_ACTION_SIMULATION_V1 = engineFlags.actionSimulationV1;
/** @see engineFlags.actionSimulationPanelV1 */
export const FEATURE_ACTION_SIMULATION_PANEL_V1 = engineFlags.actionSimulationPanelV1;
/** @see engineFlags.actionSimulationComparisonV1 */
export const FEATURE_ACTION_SIMULATION_COMPARISON_V1 = engineFlags.actionSimulationComparisonV1;

/** @see engineFlags.syriaRegionAdapterV1 — Syria regional read path for global intelligence / dashboards. */
export const FEATURE_SYRIA_REGION_ADAPTER_V1 = engineFlags.syriaRegionAdapterV1;
/** @see engineFlags.regionListingKeyV1 */
export const FEATURE_REGION_LISTING_KEY_V1 = engineFlags.regionListingKeyV1;
/** @see engineFlags.syriaPreviewV1 — Syria listing preview pipeline (DRY_RUN only). */
export const FEATURE_SYRIA_PREVIEW_V1 = engineFlags.syriaPreviewV1;
/** @see engineFlags.legalTrustRankingV1 */
export const FEATURE_LEGAL_TRUST_RANKING_V1 = engineFlags.legalTrustRankingV1;

function envTrue(k: string): boolean {
  return process.env[k] === "true" || process.env[k] === "1";
}

/**
 * LECIPM phased rollout — enable each layer independently in production (default off).
 * Strict build order: phase N+1 assumes phase N is validated in development; runtime flags stay separate.
 * @see docs/LECIPM-ROLLOUT.md
 */
export const lecipmRolloutFlags = {
  /** Phase 1 — ESG intelligence + acquisition screening foundation */
  esgV1: envTrue("FEATURE_ESG_V1"),
  /** Phase 2 — investor memo + IC pack outputs */
  investorV1: envTrue("FEATURE_INVESTOR_V1"),
  /** Phase 3 — deal pipeline + committee workflow */
  dealsV1: envTrue("FEATURE_DEALS_V1"),
  /** Phase 4 — capital stack + lender workflow */
  capitalV1: envTrue("FEATURE_CAPITAL_V1"),
  /** Phase 5 — closing room + asset onboarding */
  closingV1: envTrue("FEATURE_CLOSING_V1"),
  /** Phase 6 — portfolio intelligence */
  portfolioV1: envTrue("FEATURE_PORTFOLIO_V1"),
  /** Phase 7 — multi-agent executive command center */
  executiveV1: envTrue("FEATURE_EXECUTIVE_V1"),
} as const;

export type LecipmRolloutFlagKey = keyof typeof lecipmRolloutFlags;

/** @see lecipmRolloutFlags.esgV1 */
export const FEATURE_ESG_V1 = lecipmRolloutFlags.esgV1;
/** @see lecipmRolloutFlags.investorV1 */
export const FEATURE_INVESTOR_V1 = lecipmRolloutFlags.investorV1;
/** @see lecipmRolloutFlags.dealsV1 */
export const FEATURE_DEALS_V1 = lecipmRolloutFlags.dealsV1;
/** @see lecipmRolloutFlags.capitalV1 */
export const FEATURE_CAPITAL_V1 = lecipmRolloutFlags.capitalV1;
/** @see lecipmRolloutFlags.closingV1 */
export const FEATURE_CLOSING_V1 = lecipmRolloutFlags.closingV1;
/** @see lecipmRolloutFlags.portfolioV1 */
export const FEATURE_PORTFOLIO_V1 = lecipmRolloutFlags.portfolioV1;
/** @see lecipmRolloutFlags.executiveV1 */
export const FEATURE_EXECUTIVE_V1 = lecipmRolloutFlags.executiveV1;

/**
 * Legal Hub — deterministic intelligence, review priority, anomaly surfacing (default off).
 */
export const legalIntelligenceFlags = {
  legalIntelligenceV1: envTrue("FEATURE_LEGAL_INTELLIGENCE_V1"),
  legalReviewPriorityV1: envTrue("FEATURE_LEGAL_REVIEW_PRIORITY_V1"),
  legalAnomalyDetectionV1: envTrue("FEATURE_LEGAL_ANOMALY_DETECTION_V1"),
  /** Normalized legal risk/verification indicators for admin (no accusatory fraud claims). */
  legalFraudEngineV1: envTrue("FEATURE_LEGAL_FRAUD_ENGINE_V1"),
} as const;

export type LegalIntelligenceFlagKey = keyof typeof legalIntelligenceFlags;

/** Admin operational panels (audit timeline, scoped review) — default off. */
export const adminOpsFlags = {
  adminAuditPanelV1: envTrue("FEATURE_ADMIN_AUDIT_PANEL_V1"),
} as const;

/** @see adminOpsFlags.adminAuditPanelV1 */
export const FEATURE_ADMIN_AUDIT_PANEL_V1 = adminOpsFlags.adminAuditPanelV1;

/** @see legalIntelligenceFlags.legalFraudEngineV1 */
export const FEATURE_LEGAL_FRAUD_ENGINE_V1 = legalIntelligenceFlags.legalFraudEngineV1;

/**
 * Revenue Enforcement V1 — log + soft guard wrappers (default off). Does not change Stripe webhooks.
 */
export const revenueEnforcementFlags = {
  revenueEnforcementV1: envTrue("FEATURE_REVENUE_ENFORCEMENT_V1"),
  revenueDashboardV1: envTrue("FEATURE_REVENUE_DASHBOARD_V1"),
} as const;

export const FEATURE_REVENUE_DASHBOARD_V1 = revenueEnforcementFlags.revenueDashboardV1;

/**
 * Revenue automation — suggest / assisted copy / safe triggers only (`modules/revenue/revenue-automation-engine`).
 */
export const revenueAutomationFlags = {
  revenueAutomationV1: envTrue("FEATURE_REVENUE_AUTOMATION_V1"),
  globalMosV1: envTrue("FEATURE_GLOBAL_MOS_V1"),
};

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

/**
 * Governed autonomy OS layer — outcome-based engine, dynamic pricing (with FEATURE_DYNAMIC_PRICING_V1), portfolio allocator, dashboard (default off).
 */
export const autonomyOsLayerFlags = {
  autonomyCoreV1: envTrue("FEATURE_AUTONOMY_CORE_V1"),
  learningLoopV1: envTrue("FEATURE_LEARNING_LOOP_V1"),
  autonomyActionsV1: envTrue("FEATURE_AUTONOMY_ACTIONS_V1"),
  portfolioAllocatorV1: envTrue("FEATURE_PORTFOLIO_ALLOCATOR_V1"),
  autonomyDashboardV1: envTrue("FEATURE_AUTONOMY_DASHBOARD_V1"),
} as const;

export type AutonomyOsLayerFlagKey = keyof typeof autonomyOsLayerFlags;

/** @see autonomyOsLayerFlags.autonomyCoreV1 */
export const FEATURE_AUTONOMY_CORE_V1 = autonomyOsLayerFlags.autonomyCoreV1;
/** @see autonomyOsLayerFlags.learningLoopV1 */
export const FEATURE_LEARNING_LOOP_V1 = autonomyOsLayerFlags.learningLoopV1;
/** @see autonomyOsLayerFlags.autonomyActionsV1 */
export const FEATURE_AUTONOMY_ACTIONS_V1 = autonomyOsLayerFlags.autonomyActionsV1;
/** @see autonomyOsLayerFlags.portfolioAllocatorV1 */
export const FEATURE_PORTFOLIO_ALLOCATOR_V1 = autonomyOsLayerFlags.portfolioAllocatorV1;
/** @see autonomyOsLayerFlags.autonomyDashboardV1 */
export const FEATURE_AUTONOMY_DASHBOARD_V1 = autonomyOsLayerFlags.autonomyDashboardV1;

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
  /** Never auto-enabled — manual host/admin apply + audits only when all guardrails allow. */
  bnhubDynamicPricingApplyV1: envTrue("FEATURE_BNHUB_DYNAMIC_PRICING_APPLY_V1"),
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
  /** Persistent marketplace memory (preferences, intent) — capture, aggregation, insights (default off). */
  marketplaceMemoryEngineV1: envTrue("FEATURE_MARKETPLACE_MEMORY_ENGINE_V1"),
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
  /**
   * LECIPM production feedback loop — `launch-logger` hooks write append-only `LecipmOutcomeEvent` rows (opt-in for noisy tags).
   * Default off: enable with `FEATURE_LECIPM_OUTCOME_LOOP_V1=1` when the migration is applied.
   */
  outcomeFeedbackLoopV1: envTrue("FEATURE_LECIPM_OUTCOME_LOOP_V1"),
} as const;

export type IntelligenceFlagKey = keyof typeof intelligenceFlags;

export const FEATURE_MARKETPLACE_MEMORY_ENGINE_V1 = intelligenceFlags.marketplaceMemoryEngineV1;

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
/** Legacy marketing toggles (`LecipmMarketingLandingV1`, pricing strip, ROI CTAs). Homepage is `LecipmLuxuryHomepage` (`app/page.tsx`, `/[locale]/[country]/page.tsx`). */
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

/** Broker AI helpers — deterministic workflow support only (no legal conclusions). Default off. */
export const brokerAiFlags = {
  brokerAiCertificateOfLocationV1: envTrue("FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V1"),
  brokerAiCertificateBlockerV1: envTrue("FEATURE_BROKER_AI_CERTIFICATE_BLOCKER_V1"),
  /** Structured parsing + timeline/consistency signals + workflow hooks (deterministic). */
  brokerAiCertificateOfLocationV2: envTrue("FEATURE_BROKER_AI_CERTIFICATE_OF_LOCATION_V2"),
} as const;

export type BrokerAiFlagKey = keyof typeof brokerAiFlags;

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
  /** Broker conflict-of-interest / self-dealing: disclosure status, client consent, progression gates. */
  brokerConflictDisclosureV1: envTrue("FEATURE_BROKER_CONFLICT_DISCLOSURE_V1"),
  /** Broker-filed mandatory disclosure (OACIQ) before offers, publish, and deal creation. */
  mandatoryBrokerDisclosureV1: envTrue("FEATURE_MANDATORY_BROKER_DISCLOSURE_V1"),
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

/**
 * Legal Hub v1 — compliance workflow / document status (read-only; not legal advice). Default off.
 */
export const legalHubFlags = {
  legalHubV1: envTrue("FEATURE_LEGAL_HUB_V1"),
  legalHubDocumentsV1: envTrue("FEATURE_LEGAL_HUB_DOCUMENTS_V1"),
  legalHubRisksV1: envTrue("FEATURE_LEGAL_HUB_RISKS_V1"),
  legalHubAdminReviewV1: envTrue("FEATURE_LEGAL_HUB_ADMIN_REVIEW_V1"),
  /** Phase 2 — user uploads & submission lifecycle (server-validated; not legal advice). */
  legalUploadV1: envTrue("FEATURE_LEGAL_UPLOAD_V1"),
  legalReviewV1: envTrue("FEATURE_LEGAL_REVIEW_V1"),
  legalWorkflowSubmissionV1: envTrue("FEATURE_LEGAL_WORKFLOW_SUBMISSION_V1"),
  /** Phase 3 — deterministic legal gates on high-risk product actions (soft/hard; never auto-approve). */
  legalEnforcementV1: envTrue("FEATURE_LEGAL_ENFORCEMENT_V1"),
  /** Phase 3 — readiness score card (derived from checklist + risks; not legal advice). */
  legalReadinessV1: envTrue("FEATURE_LEGAL_READINESS_V1"),
  /** Imported legal records — deterministic parse/validation stored on `LegalRecord`. */
  legalRecordImportV1: envTrue("FEATURE_LEGAL_RECORD_IMPORT_V1"),
  /** Rule outcomes bundled with validation (explainable impacts). */
  legalRuleEngineV1: envTrue("FEATURE_LEGAL_RULE_ENGINE_V1"),
  /** Record-derived intelligence signals / preview bridges (deterministic — not ML). */
  legalAiLogicV1: envTrue("FEATURE_LEGAL_AI_LOGIC_V1"),
} as const;

export type LegalHubFlagKey = keyof typeof legalHubFlags;

/** Env-backed mirrors for ops docs (`FEATURE_LEGAL_HUB_*`) — same values as `legalHubFlags`. */
export const FEATURE_LEGAL_HUB_V1 = legalHubFlags.legalHubV1;
export const FEATURE_LEGAL_HUB_DOCUMENTS_V1 = legalHubFlags.legalHubDocumentsV1;
export const FEATURE_LEGAL_HUB_RISKS_V1 = legalHubFlags.legalHubRisksV1;
export const FEATURE_LEGAL_HUB_ADMIN_REVIEW_V1 = legalHubFlags.legalHubAdminReviewV1;
export const FEATURE_LEGAL_UPLOAD_V1 = legalHubFlags.legalUploadV1;
export const FEATURE_LEGAL_REVIEW_V1 = legalHubFlags.legalReviewV1;
export const FEATURE_LEGAL_WORKFLOW_SUBMISSION_V1 = legalHubFlags.legalWorkflowSubmissionV1;
export const FEATURE_LEGAL_ENFORCEMENT_V1 = legalHubFlags.legalEnforcementV1;
export const FEATURE_LEGAL_READINESS_V1 = legalHubFlags.legalReadinessV1;
export const FEATURE_LEGAL_RECORD_IMPORT_V1 = legalHubFlags.legalRecordImportV1;
export const FEATURE_LEGAL_RULE_ENGINE_V1 = legalHubFlags.legalRuleEngineV1;
export const FEATURE_LEGAL_AI_LOGIC_V1 = legalHubFlags.legalAiLogicV1;

/** Québec checklist + deterministic publish gate (feature-flagged). */
export const complianceFlags = {
  /** Deterministic Québec compliance checklist evaluation on listings/workflows. */
  quebecComplianceV1: envTrue("FEATURE_QUEBEC_COMPLIANCE_V1"),
  /** Hard block FSBO publish when checklist fails (with explainable payload). */
  complianceAutoBlockV1: envTrue("FEATURE_COMPLIANCE_AUTO_BLOCK_V1"),
  /** Phase 8 — extended checklist definitions + readiness scoring package. */
  quebecListingComplianceV1: envTrue("FEATURE_QUEBEC_LISTING_COMPLIANCE_V1"),
  /** Phase 8 — property legal risk index for publish + ranking signals. */
  propertyLegalRiskScoreV1: envTrue("FEATURE_PROPERTY_LEGAL_RISK_SCORE_V1"),
  /** Phase 8 — unified prepublish gate (pairs with legacy auto-block when enabled). */
  listingPrepublishAutoBlockV1: envTrue("FEATURE_LISTING_PREPUBLISH_AUTO_BLOCK_V1"),
  /**
   * Québec Reg. 2025 — hard block CRM listing publish / offer acceptance when
   * `coownership_certificate` checklist item is not completed (CONDOS / explicit co-ownership).
   */
  coownershipEnforcement: envTrue("FEATURE_COOWNERSHIP_ENFORCEMENT"),
  /**
   * Divided co-ownership — additionally require mandatory insurance gate rows (syndicate building,
   * syndicate liability, co-owner liability tier) before publish / offer acceptance + autopilot block when enabled.
   */
  coownershipInsuranceEnforcement: envTrue("FEATURE_COOWNERSHIP_INSURANCE_ENFORCEMENT"),
  /**
   * Unified merged checklist — hard block publish / readiness when CRITICAL merged items (certificate +
   * syndicate insurance verification) are missing (see CRITICAL_COMPLIANCE_BLOCK_KEYS).
   */
  coownershipComplianceEnforcement: envTrue("FEATURE_COOWNERSHIP_COMPLIANCE_ENFORCEMENT"),
  /**
   * Seller declaration gate — block CRM publish and marketplace offers when declaration is missing or incomplete;
   * allow explicit refusal with buyer warning only (OACIQ-style liability posture). FSBO publish still uses Seller Hub checks.
   */
  sellerDeclarationComplianceGateV1: envTrue("FEATURE_SELLER_DECLARATION_COMPLIANCE_GATE_V1"),
  /**
   * OACIQ — Representation, Solicitation, Promotion & Advertising rule engine on CRM listing publish
   * (licence, identity, mandate contract, sold/price, coming soon, guarantees, etc.).
   */
  oaciqRepresentationAdvertisingEngineV1: envTrue("FEATURE_OACIQ_REPRESENTATION_ADVERTISING_ENGINE_V1"),
  /**
   * OACIQ / FINTRAC-style AML rule engine — deal dry-run API + scoring (KYC, trust, fraud indicators).
   * Default off; wire to deal milestones when ready.
   */
  oaciqAmlEngineV1: envTrue("FEATURE_OACIQ_AML_ENGINE_V1"),
  /**
   * Québec — French public copy + residential scope gates on CRM listing publish; broker chat FR companion metadata.
   */
  quebecLanguageComplianceV1: envTrue("FEATURE_QUEBEC_LANGUAGE_COMPLIANCE_V1"),
  /**
   * OACIQ clause library + structural validation (actor, deadline, consequence, ambiguity) for contract workflows.
   */
  oaciqClauseComplianceEngineV1: envTrue("FEATURE_OACIQ_CLAUSE_COMPLIANCE_ENGINE_V1"),
  /**
   * LECIPM — OACIQ brokerage mandate + CRM seller declaration + identity proof + disclosure traceability.
   * Gates CRM publish when mandatory rows are incomplete; refusal hard-stops listing.
   */
  lecipmOaciqBrokerageFormsEngineV1: envTrue("FEATURE_LECIPM_OACIQ_BROKERAGE_FORMS_V1"),
  /** Harden Co-Ownership — require DOCUMENTED+ level for critical/insurance rows. */
  coownershipVerificationEnforcement: envTrue("FEATURE_COOWNERSHIP_VERIFICATION_ENFORCEMENT"),
  /** Harden Co-Ownership — block readiness/autopilot when critical rows are expired. */
  coownershipExpiryEnforcement: envTrue("FEATURE_COOWNERSHIP_EXPIRY_ENFORCEMENT"),
} as const;

export type ComplianceFlagKey = keyof typeof complianceFlags;

export const FEATURE_QUEBEC_COMPLIANCE_V1 = complianceFlags.quebecComplianceV1;
export const FEATURE_COMPLIANCE_AUTO_BLOCK_V1 = complianceFlags.complianceAutoBlockV1;
export const FEATURE_QUEBEC_LISTING_COMPLIANCE_V1 = complianceFlags.quebecListingComplianceV1;
export const FEATURE_PROPERTY_LEGAL_RISK_SCORE_V1 = complianceFlags.propertyLegalRiskScoreV1;
export const FEATURE_LISTING_PREPUBLISH_AUTO_BLOCK_V1 = complianceFlags.listingPrepublishAutoBlockV1;
export const FEATURE_COOWNERSHIP_ENFORCEMENT = complianceFlags.coownershipEnforcement;
export const FEATURE_COOWNERSHIP_INSURANCE_ENFORCEMENT = complianceFlags.coownershipInsuranceEnforcement;
export const FEATURE_COOWNERSHIP_COMPLIANCE_ENFORCEMENT = complianceFlags.coownershipComplianceEnforcement;
export const FEATURE_COOWNERSHIP_VERIFICATION_ENFORCEMENT = complianceFlags.coownershipVerificationEnforcement;
export const FEATURE_COOWNERSHIP_EXPIRY_ENFORCEMENT = complianceFlags.coownershipExpiryEnforcement;
export const FEATURE_SELLER_DECLARATION_COMPLIANCE_GATE_V1 = complianceFlags.sellerDeclarationComplianceGateV1;
export const FEATURE_OACIQ_REPRESENTATION_ADVERTISING_ENGINE_V1 =
  complianceFlags.oaciqRepresentationAdvertisingEngineV1;
export const FEATURE_OACIQ_AML_ENGINE_V1 = complianceFlags.oaciqAmlEngineV1;
export const FEATURE_QUEBEC_LANGUAGE_COMPLIANCE_V1 = complianceFlags.quebecLanguageComplianceV1;
export const FEATURE_OACIQ_CLAUSE_COMPLIANCE_ENGINE_V1 = complianceFlags.oaciqClauseComplianceEngineV1;
export const FEATURE_LECIPM_OACIQ_BROKERAGE_FORMS_V1 = complianceFlags.lecipmOaciqBrokerageFormsEngineV1;

/** Phase 4.5 — append-only compliance event timeline (Legal Hub + marketplace governance facts). Default off. */
export const eventTimelineFlags = {
  eventTimelineV1: envTrue("FEATURE_EVENT_TIMELINE_V1"),
} as const;

export type EventTimelineFlagKey = keyof typeof eventTimelineFlags;

/** Env mirror for ops docs */
export const FEATURE_EVENT_TIMELINE_V1 = eventTimelineFlags.eventTimelineV1;

/**
 * Insurance trust intelligence — batch trust multipliers in residential browse, stricter validation in code paths.
 * Default off: opt in with FEATURE_INSURANCE_TRUST_INTELLIGENCE_V1=true
 */
export const complianceInsuranceFlags = {
  trustIntelligenceV1: envTrue("FEATURE_INSURANCE_TRUST_INTELLIGENCE_V1"),
} as const;

export type ComplianceInsuranceFlagKey = keyof typeof complianceInsuranceFlags;

export const FEATURE_INSURANCE_TRUST_INTELLIGENCE_V1 = complianceInsuranceFlags.trustIntelligenceV1;

/** Phase 5 — deterministic trust scoring, ranking weight, badges (product signals only). */
export const trustFlags = {
  trustScoringV1: envTrue("FEATURE_TRUST_SCORING_V1"),
  trustRankingV1: envTrue("FEATURE_TRUST_RANKING_V1"),
  trustBadgesV1: envTrue("FEATURE_TRUST_BADGES_V1"),
} as const;

export type TrustFlagKey = keyof typeof trustFlags;

export const FEATURE_TRUST_SCORING_V1 = trustFlags.trustScoringV1;
export const FEATURE_TRUST_RANKING_V1 = trustFlags.trustRankingV1;
export const FEATURE_TRUST_BADGES_V1 = trustFlags.trustBadgesV1;

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
