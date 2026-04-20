/** Outcome-based self-improving autonomy layer types (LECIPM governed OS — not unrestricted ML). */

export type AutonomyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL";

export type AutonomyDomain =
  | "PRICING"
  | "MARKETING"
  | "LEADS"
  | "BROKER_ROUTING"
  | "CONTENT"
  | "HOSTING"
  | "INVESTMENT"
  | "MAINTENANCE"
  | "RISK";

export type ActionStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "SKIPPED"
  | "ROLLED_BACK";

export type OutcomeLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "UNKNOWN";

export interface AutonomyPolicyResult {
  id: string;
  domain: AutonomyDomain;
  severity: "INFO" | "WARNING" | "CRITICAL";
  allowed: boolean;
  requiresHumanApproval: boolean;
  reason: string;
}

export interface ProposedAction {
  id: string;
  domain: AutonomyDomain;
  type: string;
  title: string;
  description: string;
  mode: AutonomyMode;
  status: ActionStatus;
  payload: Record<string, unknown>;
  policyResults: AutonomyPolicyResult[];
  expectedImpact?: {
    revenue?: number;
    occupancy?: number;
    leadConversion?: number;
    costSavings?: number;
    riskReduction?: number;
  };
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  rolledBackAt?: string;
}

export interface OutcomeEvent {
  id: string;
  actionId: string;
  entityId: string;
  entityType: "LISTING" | "BUILDING" | "BOOKING" | "CAMPAIGN" | "PORTFOLIO";
  domain: AutonomyDomain;
  metric: string;
  beforeValue?: number;
  afterValue?: number;
  delta?: number;
  label: OutcomeLabel;
  observedAt: string;
  notes?: string;
}

export interface DynamicPricingInput {
  listingId: string;
  basePrice: number;
  occupancyRate?: number;
  leadVolume?: number;
  bookingVelocity?: number;
  dayOfWeek?: number;
  seasonalityIndex?: number;
  localDemandIndex?: number;
  competitorMedianPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  cleaningFee?: number;
  activePromotion?: boolean;
}

export interface DynamicPricingDecision {
  listingId: string;
  suggestedPrice: number;
  confidence: number;
  factors: string[];
  deltaFromBase: number;
  shouldAutoApply: boolean;
  policyResults: AutonomyPolicyResult[];
  createdAt: string;
}

export interface LearningSnapshot {
  modelVersion: string;
  totalActions: number;
  positiveOutcomes: number;
  negativeOutcomes: number;
  successRate: number;
  averageRevenueDelta: number;
  averageOccupancyDelta: number;
  averageRiskReduction: number;
  updatedAt: string;
}

export interface CapitalAllocationDecision {
  buildingId: string;
  recommendedInvestment: number;
  expectedReturnScore: number;
  riskScore: number;
  rationale: string[];
}

export interface AutonomousSystemHealth {
  mode: AutonomyMode;
  isPaused: boolean;
  activeDomains: AutonomyDomain[];
  pendingApprovals: number;
  executedToday: number;
  rolledBackToday: number;
  criticalPolicyEvents: number;
  lastUpdatedAt: string;
  recommendedPause?: boolean;
}
