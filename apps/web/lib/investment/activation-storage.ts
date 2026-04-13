import type { MarketCity } from "@/lib/investment/deal-metrics";
import { normalizeLegacyMarketCity } from "@/lib/investment/deal-metrics";
export const LAST_DRAFT_KEY = "lecipm_investment_last_draft_v2";
export const FIRST_ANALYSIS_MILESTONE_KEY = "lecipm_first_analysis_milestone_shown_v1";
export const ACTIVATION_ANALYZED_KEY = "lecipm_activation_analyzed_v1";
export const ACTIVATION_SAVED_KEY = "lecipm_activation_saved_v1";
export const ACTIVATION_DASHBOARD_VISITED_KEY = "lecipm_activation_dashboard_visited_v1";

/** Count of high-value actions (analyze + save) for in-product feedback prompts */
export const MVP_ENGAGEMENT_ACTION_COUNT_KEY = "lecipm_mvp_engagement_action_count_v1";
export const MVP_FEEDBACK_PROMPT_DISMISSED_KEY = "lecipm_mvp_feedback_prompt_dismissed_v1";
export const MVP_RETENTION_BANNER_DISMISSED_KEY = "lecipm_mvp_retention_banner_dismissed_v1";
/** Last time a browser session started (used to detect return visits) */
export const MVP_LAST_SESSION_OPEN_TS_KEY = "lecipm_investment_last_session_open_ts_v1";
/** Dismiss for dashboard “continue analysis” banner */
export const CONTINUE_INVESTMENT_BANNER_DISMISSED_KEY = "lecipm_continue_investment_banner_dismissed_v1";

export type LastDraftPayload = {
  city: MarketCity;
  propertyPrice: string;
  monthlyRent: string;
  nightlyRate: string;
  occupancyRate: string;
  monthlyExpenses: string;
};

export function readLastDraft(): LastDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_DRAFT_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Record<string, unknown>;
    const city =
      typeof j.city === "string" ? normalizeLegacyMarketCity(j.city) : "Montréal";
    return {
      city,
      propertyPrice: typeof j.propertyPrice === "string" ? j.propertyPrice : "",
      monthlyRent: typeof j.monthlyRent === "string" ? j.monthlyRent : "",
      nightlyRate: typeof j.nightlyRate === "string" ? j.nightlyRate : "",
      occupancyRate: typeof j.occupancyRate === "string" ? j.occupancyRate : "",
      monthlyExpenses: typeof j.monthlyExpenses === "string" ? j.monthlyExpenses : "",
    };
  } catch {
    return null;
  }
}

export function writeLastDraft(payload: LastDraftPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function shouldShowFirstAnalysisMilestone(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(FIRST_ANALYSIS_MILESTONE_KEY) !== "1";
}

export function markFirstAnalysisMilestoneShown(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FIRST_ANALYSIS_MILESTONE_KEY, "1");
  } catch {
    /* ignore */
  }
}

function dispatchActivationFlagsChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event("lecipm-activation-flags-changed"));
  } catch {
    /* ignore */
  }
}

export function setActivationAnalyzed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVATION_ANALYZED_KEY, "1");
    dispatchActivationFlagsChanged();
  } catch {
    /* ignore */
  }
}

export function setActivationSaved(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVATION_SAVED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function setActivationDashboardVisited(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVATION_DASHBOARD_VISITED_KEY, "1");
    dispatchActivationFlagsChanged();
  } catch {
    /* ignore */
  }
}

export function readActivationFlags(): {
  analyzed: boolean;
  saved: boolean;
  dashboardVisited: boolean;
} {
  if (typeof window === "undefined") {
    return { analyzed: false, saved: false, dashboardVisited: false };
  }
  try {
    return {
      analyzed: window.localStorage.getItem(ACTIVATION_ANALYZED_KEY) === "1",
      saved: window.localStorage.getItem(ACTIVATION_SAVED_KEY) === "1",
      dashboardVisited: window.localStorage.getItem(ACTIVATION_DASHBOARD_VISITED_KEY) === "1",
    };
  } catch {
    return { analyzed: false, saved: false, dashboardVisited: false };
  }
}

/** Persisted activation funnel (analyze → save → dashboard). */
export type InvestmentProgress = {
  hasAnalyzed: boolean;
  hasSaved: boolean;
  hasVisitedDashboard: boolean;
};

export function readInvestmentProgress(): InvestmentProgress {
  const f = readActivationFlags();
  return {
    hasAnalyzed: f.analyzed,
    hasSaved: f.saved,
    hasVisitedDashboard: f.dashboardVisited,
  };
}

export function writeInvestmentProgress(partial: Partial<InvestmentProgress>): void {
  if (typeof window === "undefined") return;
  try {
    if (partial.hasAnalyzed === true) {
      window.localStorage.setItem(ACTIVATION_ANALYZED_KEY, "1");
    } else if (partial.hasAnalyzed === false) {
      window.localStorage.removeItem(ACTIVATION_ANALYZED_KEY);
    }
    if (partial.hasSaved === true) {
      window.localStorage.setItem(ACTIVATION_SAVED_KEY, "1");
    } else if (partial.hasSaved === false) {
      window.localStorage.removeItem(ACTIVATION_SAVED_KEY);
    }
    if (partial.hasVisitedDashboard === true) {
      window.localStorage.setItem(ACTIVATION_DASHBOARD_VISITED_KEY, "1");
    } else if (partial.hasVisitedDashboard === false) {
      window.localStorage.removeItem(ACTIVATION_DASHBOARD_VISITED_KEY);
    }
    dispatchActivationFlagsChanged();
  } catch {
    /* ignore quota */
  }
}

/** Homepage: show “continue” if user has started the investment flow before */
export function shouldShowContinueInvestmentHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hasDraft = Boolean(window.localStorage.getItem(LAST_DRAFT_KEY));
    const engaged =
      window.localStorage.getItem(ACTIVATION_ANALYZED_KEY) === "1" ||
      window.localStorage.getItem(ACTIVATION_SAVED_KEY) === "1";
    return hasDraft || engaged;
  } catch {
    return false;
  }
}

/** Dashboard: same eligibility as homepage hint, unless user dismissed the banner. */
export function shouldShowContinueInvestmentReturnBanner(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(CONTINUE_INVESTMENT_BANNER_DISMISSED_KEY) === "1") {
      return false;
    }
    return shouldShowContinueInvestmentHint();
  } catch {
    return false;
  }
}

export function dismissContinueInvestmentBanner(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONTINUE_INVESTMENT_BANNER_DISMISSED_KEY, "1");
    window.dispatchEvent(new Event("lecipm-continue-investment-banner-dismissed"));
  } catch {
    /* ignore */
  }
}

/** Analyze + save actions; used for “What do you think so far?” after 2 actions */
export function incrementMvpEngagementAction(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(MVP_ENGAGEMENT_ACTION_COUNT_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    const next = Number.isFinite(n) ? n + 1 : 1;
    window.localStorage.setItem(MVP_ENGAGEMENT_ACTION_COUNT_KEY, String(next));
    window.dispatchEvent(new CustomEvent("lecipm-mvp-actions-updated", { detail: { count: next } }));
    return next;
  } catch {
    return 0;
  }
}

export function getMvpEngagementActionCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(MVP_ENGAGEMENT_ACTION_COUNT_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function dismissMvpFeedbackPrompt(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MVP_FEEDBACK_PROMPT_DISMISSED_KEY, "1");
    window.dispatchEvent(new Event("lecipm-mvp-feedback-dismissed"));
  } catch {
    /* ignore */
  }
}

export function isMvpFeedbackPromptDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MVP_FEEDBACK_PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissMvpRetentionBanner(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MVP_RETENTION_BANNER_DISMISSED_KEY, "1");
    window.dispatchEvent(new Event("lecipm-mvp-retention-dismissed"));
  } catch {
    /* ignore */
  }
}

export function isMvpRetentionBannerDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MVP_RETENTION_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

/** First-time hints: pulse Analyze until first analyze; pulse Dashboard until first visit */
export function shouldHighlightAnalyzeNav(): boolean {
  return !readActivationFlags().analyzed;
}

export function shouldHighlightDashboardNav(): boolean {
  return !readActivationFlags().dashboardVisited;
}
