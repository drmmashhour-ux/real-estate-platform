/**
 * Read-only investor share links — no admin payload exposure on public routes.
 */

import type { InvestorMetric, InvestorNarrative, InvestorSection } from "@/modules/investors/investor-dashboard.types";

export type InvestorShareTokenStatus = "active" | "revoked" | "expired";

export type InvestorShareVisibility = {
  metrics: boolean;
  narrative: boolean;
  executionProof: boolean;
  expansionStory: boolean;
  risks: boolean;
  outlook: boolean;
};

export type InvestorShareLink = {
  id: string;
  token: string;
  status: InvestorShareTokenStatus;
  createdAt: string;
  expiresAt?: string;
  createdBy?: string;
  label?: string;
  /** Shown on the public read-only page header. */
  publicTitle: string;
  publicSubtitle?: string;
  visibility: InvestorShareVisibility;
  lastViewedAt?: string;
  viewCount: number;
  /** Rolling window for snapshot rebuild (days). */
  windowDays: number;
};

export type InvestorSharedDashboard = {
  /** Public snapshots intentionally omit internal IDs — token is proof of access only in the URL. */
  publicTitle: string;
  publicSubtitle?: string;
  metrics: InvestorMetric[];
  sections: InvestorSection[];
  narrative: InvestorNarrative;
  generatedAt: string;
  /** Investor-safe uncertainty & data-limit notices only. */
  warnings: string[];
};
