import type { HOST_FUNNEL_STAGES } from "./host-conversion.constants";

export type HostFunnelStage = (typeof HOST_FUNNEL_STAGES)[number];

export type HostConversionEventName =
  | "roi_calculator_viewed"
  | "roi_calculation_started"
  | "roi_calculation_completed"
  | "host_lead_created"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "listing_import_submitted"
  | "onboarding_completed"
  | "host_plan_viewed"
  | "pricing_insight_viewed"
  | "host_cta_clicked";
