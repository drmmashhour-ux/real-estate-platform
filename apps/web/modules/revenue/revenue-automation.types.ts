/**
 * Revenue automation — kinds, triggers, cycle output (no payment execution).
 */

export type AutomationKind = "suggestion" | "assisted" | "auto_trigger_safe";

export type AutomationTriggerId =
  | "revenue_drop"
  | "conversion_drop"
  | "no_activity"
  | "high_traffic_low_revenue";

export type AssistedPayload = {
  brokerOutreachDraft?: string;
  listingFixHighlight?: string;
  pricingAdvisoryNote?: string;
  /** In-app path for navigation (relative to site root). */
  navigatePath?: string;
  /** Short copy block for clipboard. */
  copyBlock?: string;
};

export type AutomationActionItem = {
  id: string;
  kind: AutomationKind;
  title: string;
  explanation: string;
  /** Which trigger rules contributed (explainability). */
  triggerRefs: AutomationTriggerId[];
  impactScore: number;
  urgencyScore: number;
  combinedScore: number;
  assisted?: AssistedPayload;
};

export type AutomationCycleMode = "full" | "light";

export type AutomationCycleResult = {
  ranAt: string;
  mode: AutomationCycleMode;
  skipped: boolean;
  skipReason?: string;
  triggersFired: AutomationTriggerId[];
  actions: AutomationActionItem[];
  maxActionsCap: number;
  countryCode: string;
  currency: string;
  safety: {
    killSwitchActive: boolean;
    automationFlagOn: boolean;
  };
};
