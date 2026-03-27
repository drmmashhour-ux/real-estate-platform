/**
 * Deal Analyzer Phase 2 — thresholds and defaults (no magic numbers in services).
 * Tune via env where noted, or extend this object.
 */

export const dealAnalyzerConfig = {
  comparable: {
    /** Max distance (km) when both listings have coordinates; else city-only match. */
    radiusKm: Number(process.env.DEAL_ANALYZER_COMP_RADIUS_KM ?? "35"),
    /** ± bedrooms allowed for a comp to be considered “in range”. */
    bedroomTolerance: Number(process.env.DEAL_ANALYZER_COMP_BED_TOLERANCE ?? "1"),
    bathroomTolerance: Number(process.env.DEAL_ANALYZER_COMP_BATH_TOLERANCE ?? "0.5"),
    /** ± fraction of subject sqft for area similarity. */
    areaRelativeTolerance: Number(process.env.DEAL_ANALYZER_COMP_AREA_TOLERANCE ?? "0.22"),
    /** Price band around subject price for candidate pool (fraction). */
    priceBandFraction: Number(process.env.DEAL_ANALYZER_COMP_PRICE_BAND ?? "0.45"),
    maxCandidates: 80,
    minGoodComps: Number(process.env.DEAL_ANALYZER_MIN_COMP_COUNT ?? "3"),
    /** Below this count, positioning confidence is degraded. */
    minCompsForMediumConfidence: Number(process.env.DEAL_ANALYZER_MIN_COMP_MEDIUM ?? "5"),
    similarityWeights: {
      bedroom: 0.22,
      bathroom: 0.18,
      area: 0.22,
      distance: 0.28,
      propertyType: 0.1,
    },
    minAvgSimilarityForHighConfidence: 0.62,
  },
  scenario: {
    rental: {
      /** Aligns with `computeIncomeComponent` rough rent heuristic (not market rent). */
      priceToMonthlyRentFactor: 0.0045,
      conservativeRentMultiplier: 0.9,
      expectedRentMultiplier: 1.0,
      aggressiveRentMultiplier: 1.08,
      conservativeOccupancy: 0.88,
      expectedOccupancy: 0.93,
      aggressiveOccupancy: 0.97,
      operatingCostPctOfRent: {
        conservative: 0.42,
        expected: 0.36,
        aggressive: 0.32,
      },
      /** Minimum sqft + beds to allow any rent scenario (weak data path). */
      minSqftForRentScenario: 350,
      minBedsForRentScenario: 1,
    },
    financing: {
      defaultApr: Number(process.env.DEAL_ANALYZER_DEFAULT_MORTGAGE_APR ?? "0.065"),
      defaultTermYears: Number(process.env.DEAL_ANALYZER_DEFAULT_MORTGAGE_TERM ?? "25"),
    },
  },
  bnhub: {
    defaultOccupancy: Number(process.env.DEAL_ANALYZER_BNHUB_DEFAULT_OCCUPANCY ?? "0.55"),
    conservativeOccupancy: Number(process.env.DEAL_ANALYZER_BNHUB_CONSERVATIVE_OCC ?? "0.42"),
    aggressiveOccupancy: Number(process.env.DEAL_ANALYZER_BNHUB_AGGRESSIVE_OCC ?? "0.68"),
    platformFeePct: Number(process.env.DEAL_ANALYZER_BNHUB_PLATFORM_FEE_PCT ?? "0.12"),
    /** Turnover / cleaning as fraction of gross short-term revenue (rules-based). */
    turnoverCostPct: Number(process.env.DEAL_ANALYZER_BNHUB_TURNOVER_PCT ?? "0.08"),
    /** Illustrative cleaning events per month for cost spread (not booking data). */
    assumedCleaningEventsPerMonth: Number(process.env.DEAL_ANALYZER_BNHUB_CLEANING_EVENTS ?? "4"),
  },
  portfolio: {
    weights: {
      investment: 0.35,
      inverseRisk: 0.25,
      confidence: 0.2,
      trustReadiness: 0.2,
    },
    topOpportunityThreshold: 78,
    stableThreshold: 58,
    needsReviewThreshold: 38,
  },
  decision: {
    strongTrustMin: 72,
    lowTrustMax: 42,
    highRiskMin: 72,
    lowConfidenceIsAggressive: false,
  },
  /** Phase 3 — offer / affordability / alerts / pricing advisor / strategy (all rules-based). */
  phase3: {
    offer: {
      minPctOfAsk: Number(process.env.DEAL_ANALYZER_OFFER_MIN_PCT ?? "0.92"),
      targetPctOfAsk: Number(process.env.DEAL_ANALYZER_OFFER_TARGET_PCT ?? "0.98"),
      maxPctOfAsk: Number(process.env.DEAL_ANALYZER_OFFER_MAX_PCT ?? "1.03"),
      weakCompBandWiden: Number(process.env.DEAL_ANALYZER_OFFER_WEAK_COMP_WIDEN ?? "0.04"),
      lowTrustMinPct: Number(process.env.DEAL_ANALYZER_OFFER_LOW_TRUST_MIN_PCT ?? "0.88"),
    },
    affordability: {
      /** Front-end ratio: housing payment / gross monthly income. */
      likelyAffordableMax: Number(process.env.DEAL_ANALYZER_AFFORD_LIKELY_MAX ?? "0.28"),
      borderlineMax: Number(process.env.DEAL_ANALYZER_AFFORD_BORDERLINE_MAX ?? "0.36"),
      stretchedMax: Number(process.env.DEAL_ANALYZER_AFFORD_STRETCHED_MAX ?? "0.44"),
    },
    alerts: {
      scoreChangeMinPoints: Number(process.env.DEAL_ANALYZER_ALERT_SCORE_DELTA ?? "5"),
      riskIncreaseMinPoints: Number(process.env.DEAL_ANALYZER_ALERT_RISK_DELTA ?? "7"),
    },
    pricingAdvisor: {
      slightlyHighMedianRatio: Number(process.env.DEAL_ANALYZER_PRICE_SLIGHTLY_HIGH ?? "1.06"),
      meaningfullyHighMedianRatio: Number(process.env.DEAL_ANALYZER_PRICE_HIGH ?? "1.12"),
    },
    strategyWeights: {
      buy_to_live: { cashFlow: 0.15, pricePosition: 0.25, trust: 0.35, risk: 0.25 },
      buy_to_rent: { cashFlow: 0.45, pricePosition: 0.2, trust: 0.2, risk: 0.15 },
      buy_to_flip: { cashFlow: 0.15, pricePosition: 0.4, trust: 0.15, risk: 0.3 },
      buy_for_bnhub: { cashFlow: 0.35, pricePosition: 0.15, trust: 0.25, risk: 0.25 },
      hold_long_term: { cashFlow: 0.2, pricePosition: 0.2, trust: 0.35, risk: 0.25 },
    },
    disclaimers: {
      offer:
        "This is educational guidance only — not legal, tax, or brokerage advice. It does not guarantee offer acceptance or deal success.",
      affordability:
        "Estimated affordability only — not a mortgage pre-approval or lender decision. Verify with a licensed mortgage professional.",
      pricingAdvisor:
        "This is not an appraisal or pricing guarantee. Market evidence may differ.",
    },
  },
  /** Phase 4 — refresh automation, regional rules, playbooks, repricing, portfolio monitoring. */
  phase4: {
    refresh: {
      stalenessHours: Number(process.env.DEAL_ANALYZER_REFRESH_STALE_HOURS ?? "72"),
      minHoursBetweenAutoRefresh: Number(process.env.DEAL_ANALYZER_REFRESH_MIN_HOURS ?? "24"),
      priceChangeTriggerPct: Number(process.env.DEAL_ANALYZER_REFRESH_PRICE_CHANGE_PCT ?? "0.02"),
      listingEditTriggerHours: Number(process.env.DEAL_ANALYZER_REFRESH_LISTING_EDIT_HOURS ?? "1"),
    },
    regional: {
      denseUrbanRadiusKm: Number(process.env.DEAL_ANALYZER_REGION_DENSE_RADIUS_KM ?? "12"),
      suburbanRadiusKm: Number(process.env.DEAL_ANALYZER_REGION_SUBURBAN_RADIUS_KM ?? "22"),
      sparseRadiusKm: Number(process.env.DEAL_ANALYZER_REGION_SPARSE_RADIUS_KM ?? "45"),
      denseMinGoodComps: Number(process.env.DEAL_ANALYZER_REGION_DENSE_MIN_COMPS ?? "4"),
      sparseMinGoodComps: Number(process.env.DEAL_ANALYZER_REGION_SPARSE_MIN_COMPS ?? "2"),
      lowDataConfidencePenalty: Number(process.env.DEAL_ANALYZER_REGION_LOW_DATA_PENALTY ?? "0.15"),
    },
    marketCondition: {
      sellerFavorableMinComps: Number(process.env.DEAL_ANALYZER_MC_SELLER_MIN_COMPS ?? "5"),
      staleListingDays: Number(process.env.DEAL_ANALYZER_MC_STALE_DAYS ?? "45"),
    },
    repricing: {
      staleDays: Number(process.env.DEAL_ANALYZER_REPRICE_STALE_DAYS ?? "60"),
      trustImprovementMinDelta: Number(process.env.DEAL_ANALYZER_REPRICE_TRUST_DELTA ?? "8"),
    },
    monitoring: {
      opportunityShiftMinPoints: Number(process.env.DEAL_ANALYZER_MONITOR_OPP_DELTA ?? "5"),
      trustDropMinPoints: Number(process.env.DEAL_ANALYZER_MONITOR_TRUST_DELTA ?? "6"),
    },
    disclaimers: {
      playbook:
        "Negotiation playbooks are educational patterns only — not legal advice. Keep standard protections unless you accept additional risk.",
      repricing:
        "This is a review prompt — not a pricing recommendation or appraisal. Verify with local comparables.",
      monitoring:
        "Portfolio signals are rules-based indicators — not investment advice or performance guarantees.",
    },
  },
} as const;
