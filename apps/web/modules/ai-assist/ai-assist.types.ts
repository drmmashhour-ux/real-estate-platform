import type { ActionClass, AutomationHubId, ReasonCode } from "@/modules/automation/automation.types";

export type AiAssistBundleId =
  | "listing_quality"
  | "broker_leads"
  | "investor_opportunities"
  | "admin_daily_summary"
  | "host_revenue";

export type AiRecommendationItem = {
  id: string;
  hub: AutomationHubId;
  actionClass: ActionClass;
  title: string;
  body: string;
  reasonCodes: ReasonCode[];
  /** Stable references e.g. listingId:uuid */
  refs?: Record<string, string>;
};

export type AiAssistBundle = {
  bundleId: AiAssistBundleId;
  generatedAt: string;
  items: AiRecommendationItem[];
};

export type AiAssistResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; code: string };
