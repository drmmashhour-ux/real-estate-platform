import type { LecipmNoShowRiskBand, LecipmVisitWorkflowState } from "@prisma/client";

export type NoShowRiskBand = "LOW" | "MEDIUM" | "HIGH";

export type NoShowRiskResult = {
  riskScore: number;
  riskBand: NoShowRiskBand;
  reasons: string[];
  /** Human + operational next step (not a guarantee). */
  suggestedAction: string;
};

export type NoShowSourceChannel = "CENTRIS" | "DIRECT" | "AI_CLOSER" | "BROKER" | "MOBILE" | "UNKNOWN";

export type ReminderKind = "post_book" | "h24" | "h3" | "m30" | "reconfirm" | "nudge_high_risk";

export type EngagementHintPayload = {
  kindsSent: ReminderKind[];
  emailLastOpenedAt?: string;
  emailLastClickAt?: string;
};

export type LecipmVisitForRisk = {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  createdAt: Date;
  status: string;
  workflowState: LecipmVisitWorkflowState;
  reconfirmedAt: Date | null;
  noShowRiskScore: number;
  noShowRiskBand: LecipmNoShowRiskBand | null;
  rescheduleCount: number;
  engagementHints: unknown;
  lead: {
    id: string;
    score: number;
    source: string | null;
    distributionChannel: string | null;
    purchaseRegion: string | null;
    optedOutOfFollowUp: boolean;
    lastContactedAt: Date | null;
    estimatedValue: number | null;
  };
  visitRequest: { visitSource: string | null };
  listing: { title: string; listingCode: string; ownerId: string | null } | null;
  broker: { id: string };
};

export type NoShowExplainability = {
  summary: string;
  topSignals: { label: string; weight: string }[];
  nextBestAction: string;
  complianceNote: string;
};

export type RescheduleRequestResult =
  | { ok: true; visitId: string; message: string }
  | { ok: false; error: string; code: "conflict" | "validation" | "not_found" | "forbidden" };
