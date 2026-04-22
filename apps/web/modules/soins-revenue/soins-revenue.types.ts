/** Residence product tier (pricing catalog). Aligns with care residence classification. */
export type SoinsResidenceTier = "INDEPENDENT" | "ASSISTED" | "MEDICAL";

/** Incremental care package uplift on top of base bed price. */
export type SoinsCareTier = "INDEPENDENT" | "ASSISTED" | "MEMORY_CARE" | "SKILLED";

export type SoinsFoodTier = "NONE" | "ONE_MEAL" | "FULL";

export type SoinsFamilyAddonKey =
  | "CAMERA_ACCESS"
  | "ADVANCED_ALERTS"
  | "FAMILY_PREMIUM_DASHBOARD"
  | "MULTI_FAMILY_MEMBER_SLOT"
  | "ARCHIVED_CHAT_HISTORY";

export type SoinsMonitoringAddonKey =
  | "STANDARD_OPS_MONITORING"
  | "PREMIUM_AI_SUMMARY"
  | "ESCALATION_PLAYBOOK";

export type BillingCadence = "MONTHLY";

export type BillingAccountStatus =
  | "CURRENT"
  | "GRACE"
  | "OVERDUE"
  | "SUSPENDED"
  | "CANCELLED";

export type BillingNotificationTrigger =
  | "INVOICE_ISSUED"
  | "PAYMENT_DUE_SOON"
  | "OVERDUE"
  | "SERVICE_SUSPENDED"
  | "ADD_ON_CHANGED";

export type MonthlyPricingInput = {
  baseResidencePrice: number;
  /** Optional facility/program tier uplift (independent / assisted / medical residence). */
  residenceTier?: SoinsResidenceTier;
  careTier: SoinsCareTier;
  foodTier: SoinsFoodTier;
  /** Service line items (monthly CAD or platform currency unit). */
  selectedServicePrices: number[];
  familyAddons: Partial<Record<SoinsFamilyAddonKey, boolean>>;
  monitoringAddons: Partial<Record<SoinsMonitoringAddonKey, boolean>>;
  /** Optional extra per special diet (monthly). */
  specialDietSurcharge?: number;
};

export type MonthlyPricingResult = {
  monthlyTotal: number;
  breakdown: Array<{ code: string; label: string; amount: number }>;
};

export type ProrationInput = {
  monthlyAmount: number;
  periodStart: Date;
  periodEnd: Date;
  /** Service activation inside the billing period */
  serviceStart: Date;
};

export type ProrationResult = {
  billableFraction: number;
  proratedAmount: number;
};

export type BillingRulesConfig = {
  /** Days after due before overdue */
  graceDays: number;
  /** Days overdue before suspension recommendation */
  suspendAfterOverdueDays: number;
  /** Notify N days before due */
  remindBeforeDueDays: number;
};

export type SubscriptionOverdueInput = {
  dueDate: Date;
  paidDate: Date | null;
  now: Date;
  status: BillingAccountStatus;
};

export type RevenueLineCategory =
  | "RESIDENCE_SUBSCRIPTION"
  | "LISTING_FEE"
  | "SERVICE_FEE"
  | "FAMILY_ADDON"
  | "MONITORING"
  | "ONBOARDING_SETUP";

export type RevenueLedgerEntry = {
  id: string;
  category: RevenueLineCategory;
  amount: number;
  currency: string;
  residenceId?: string | null;
  residentId?: string | null;
  familyUserId?: string | null;
  serviceType?: string | null;
  occurredAt: Date;
};

export type SoinsRevenueSummaryVm = {
  currency: string;
  mrr: number;
  dailyRevenueApprox: number;
  revenueByResidence: Array<{ residenceId: string; label: string; amount: number }>;
  revenueByCategory: Array<{ category: RevenueLineCategory; amount: number }>;
  revenueByFamilyAddons: number;
  overdueTotal: number;
  periodStart: string;
  periodEnd: string;
};

export type ResidenceRevenueBreakdownVm = {
  residenceId: string;
  mrrContribution: number;
  listingAndSubscriptionFees: number;
  serviceFees: number;
  familyAddonShare: number;
  monitoringShare: number;
};

export type FamilySubscriptionRevenueSummaryVm = {
  currency: string;
  totalFamilyAddonMrr: number;
  byAddon: Array<{ addon: SoinsFamilyAddonKey; mrr: number }>;
  activeSubscriptionsApprox: number;
};
