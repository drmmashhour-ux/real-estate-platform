import type { LecipmShellRole } from "@/config/navigation.config";

/** Bump when tour copy or steps change so returning users see new guidance if desired. */
export const ONBOARDING_STORAGE_VERSION = "1";

export const STORAGE_ONBOARDING_COMPLETED = "lecipm:onboarding_completed";
export const STORAGE_ONBOARDING_VERSION = "lecipm:onboarding_version";

export type OnboardingStepDef = {
  id: string;
  /** Matches `data-onboarding-anchor` / `data-nav-path` used in DOM */
  targetSelector: string;
  title: string;
  body: string;
};

export function readOnboardingCompleted(): boolean {
  try {
    if (typeof window === "undefined") return true;
    const completed = window.localStorage.getItem(STORAGE_ONBOARDING_COMPLETED) === "true";
    const ver = window.localStorage.getItem(STORAGE_ONBOARDING_VERSION);
    if (completed && ver !== ONBOARDING_STORAGE_VERSION) return false;
    return completed;
  } catch {
    return true;
  }
}

export function persistOnboardingCompleted(done: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_ONBOARDING_COMPLETED, done ? "true" : "false");
    window.localStorage.setItem(STORAGE_ONBOARDING_VERSION, ONBOARDING_STORAGE_VERSION);
  } catch {
    /* ignore */
  }
}

export function resetOnboardingTour(): void {
  try {
    window.localStorage.removeItem(STORAGE_ONBOARDING_COMPLETED);
    window.localStorage.removeItem(STORAGE_ONBOARDING_VERSION);
  } catch {
    /* ignore */
  }
}

/** Role-specific spotlight sequence (IDs must match anchored UI). */
export function getOnboardingSteps(role: LecipmShellRole): OnboardingStepDef[] {
  switch (role) {
    case "RESIDENCE":
      return [
        {
          id: "sidebar",
          targetSelector: '[data-onboarding-anchor="sidebar"]',
          title: "Your navigation",
          body: "Move between overview, leads, visits, and more — everything for your residence is here.",
        },
        {
          id: "leads",
          targetSelector: '[data-nav-path="residence/leads"]',
          title: "Start with leads",
          body: "Families reach out here first — reply fast to convert interest into tours.",
        },
        {
          id: "quick-action",
          targetSelector: '[data-onboarding-anchor="quick-action"]',
          title: "Quick actions",
          body: "Add units, reply to leads, or schedule visits without hunting through menus.",
        },
      ];
    case "MANAGEMENT":
      return [
        {
          id: "sidebar",
          targetSelector: '[data-onboarding-anchor="sidebar"]',
          title: "Portfolio navigation",
          body: "Jump between residences, performance, and leads across your group.",
        },
        {
          id: "comparison",
          targetSelector: '[data-nav-path="management/portfolio"]',
          title: "Compare residences",
          body: "See side-by-side performance — spot where teams need support.",
        },
        {
          id: "performance",
          targetSelector: '[data-nav-path="management/performance"]',
          title: "Performance",
          body: "Track KPIs and trends across your portfolio in one glance.",
        },
      ];
    case "ADMIN":
      return [
        {
          id: "sidebar",
          targetSelector: '[data-onboarding-anchor="sidebar"]',
          title: "Platform workspace",
          body: "Operate the marketplace — cities, operators, intelligence, and reports.",
        },
        {
          id: "marketplace",
          targetSelector: '[data-nav-path="admin/platform"]',
          title: "Marketplace",
          body: "Tune listings, visibility, and pricing dynamics for healthy supply and demand.",
        },
        {
          id: "risk",
          targetSelector: '[data-nav-path="admin/risk"]',
          title: "Risk & alerts",
          body: "Catch SLA breaches, trust issues, and policy signals before they escalate.",
        },
      ];
    default:
      return [];
  }
}
