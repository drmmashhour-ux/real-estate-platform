/**
 * Company Command Center V4 — executive briefing layer on top of V3.
 */
import type {
  CommandCenterRole,
  CompanyCommandCenterV3Payload,
} from "@/modules/control-center-v3/company-command-center-v3.types";

export type CommandCenterPresetId = "founder_daily" | "growth_focus" | "operations_watch" | "risk_review" | string;

export type CommandCenterTimeWindow = {
  days: number;
  offsetDays: number;
  label: string;
};

export type CommandCenterDigestSeverity = "info" | "watch" | "warning" | "critical";

export type CommandCenterBriefingSeverity = "info" | "watch" | "warning" | "critical";

export type CommandCenterSavedPreset = {
  id: CommandCenterPresetId;
  name: string;
  role: CommandCenterRole;
  filters?: Record<string, string | number | boolean | null>;
  visibleSections?: string[];
  pinnedSystems?: string[];
  createdAt?: string;
  updatedAt?: string;
  builtIn?: boolean;
};

export type CommandCenterBriefingCard = {
  id: string;
  title: string;
  severity: CommandCenterBriefingSeverity;
  summary: string;
  systemsInvolved: string[];
  keyMetrics: Record<string, string | number | null>;
  recommendedFocus: string | null;
  notes?: string | null;
};

export type CommandCenterAnomalyDigestItem = {
  id: string;
  system: string;
  severity: CommandCenterDigestSeverity;
  title: string;
  summary: string;
  metric?: string | null;
  delta?: string | null;
  timestamp?: string | null;
};

export type CommandCenterSystemDelta = {
  system: string;
  changed: boolean;
  summary: string;
  changedMetrics: string[];
  riskShift?: "up" | "down" | "flat";
  opportunityShift?: "up" | "down" | "flat";
};

export type CompanyCommandCenterV4Meta = {
  currentWindow: CommandCenterTimeWindow;
  previousWindow: CommandCenterTimeWindow;
  dataFreshnessMs: number;
  sourcesUsed: string[];
  missingSources: string[];
  cardsGenerated: number;
  digestItemCount: number;
  deltaSummaryCount: number;
  presetId: CommandCenterPresetId | null;
  role: CommandCenterRole | null;
};

export type CompanyCommandCenterV4Payload = {
  /** Full V3 aggregate for current window (all roles populated). */
  v3: CompanyCommandCenterV3Payload;
  presets: CommandCenterSavedPreset[];
  activePreset: CommandCenterSavedPreset | null;
  briefing: {
    cards: CommandCenterBriefingCard[];
  };
  anomalyDigest: {
    items: CommandCenterAnomalyDigestItem[];
    countsBySeverity: Record<CommandCenterDigestSeverity, number>;
  };
  changesSinceYesterday: {
    systems: CommandCenterSystemDelta[];
    executiveSummary: string[];
    insufficientBaseline: boolean;
  };
  meta: CompanyCommandCenterV4Meta;
};

export type LoadCompanyCommandCenterV4Params = {
  days?: number;
  limit?: number;
  /** Base offset for the “current” window (default 0 = latest). */
  offsetDays?: number;
  /** How many days further back the “previous” snapshot is (default 1 = vs prior day window). */
  previousOffsetDays?: number;
  /** Raw query string; parsed in service. */
  role?: string | null;
  presetId?: string | null;
};
