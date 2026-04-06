import type { Page } from "@playwright/test";

export type E2EScenarioStatus = "PASS" | "FAIL" | "BLOCKED";

export type ScenarioResult = {
  id: number;
  name: string;
  status: E2EScenarioStatus;
  detail?: string;
  failedSteps: string[];
  criticalBugs: string[];
};

export type SharedE2EState = {
  /** Last booking created in a scenario (for chaining). */
  lastBookingId?: string;
  lastListingId?: string;
  lastGuestEmail?: string;
  stripePaidFlowOk?: boolean;
  /** Prisma snapshot of `platform_market_launch_settings` row before Syria tests. */
  marketBackupJson?: string | null;
  /** Self-healing / failure capture (optional; set from scenarios). */
  lastStepName?: string;
  activeLocale?: "en" | "fr" | "ar";
  activeMarket?: string;
  activeRole?: "guest" | "host" | "admin";
  lastRoute?: string | null;
  paymentMode?: "online" | "manual" | null;
  lastBookingStatus?: string | null;
  lastManualPaymentStatus?: string | null;
  lastApiStatus?: number | null;
  lastApiBodySnippet?: string | null;
  lastLogSnippet?: string | null;
  lastStackTrace?: string | null;
};

export type ScenarioContext = {
  page: Page;
  origin: string;
  state: SharedE2EState;
};

export function getOrigin(): string {
  return process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";
}
