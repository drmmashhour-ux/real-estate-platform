export { LECIPM_CATEGORY, LECIPM_CATEGORY_SHORT, type LecipmCategory } from "./category";
export { PRIMARY_MARKET, type PrimaryMarketConfig, type MarketPhase } from "./primary-market.config";
export type { LeadershipMetrics } from "./leadership-metrics.types";
export { evaluateLeadership, type LeadershipEvaluation, type LeadershipGap } from "./market-leadership.engine";
export { fetchLeadershipMetrics } from "./leadership-metrics.data";
export { BROKER_DOMINATION_LOOP, type BrokerDominationLoopStep, type BrokerLoopStage } from "./broker-domination.loop";
export { EXAMPLE_TESTIMONIALS, buildUsageMetricLines, type Testimonial, type UsageMetricLine } from "./social-proof";
export { buildVisibilityPlan, type VisibilityInitiative, type VisibilityChannel } from "../growth/visibility.engine";
