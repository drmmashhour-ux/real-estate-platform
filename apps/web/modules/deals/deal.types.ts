import type { DealExecutionType, DealPartyRole } from "@prisma/client";

export type { DealExecutionType, DealPartyRole };

/** Broker-assistance only — not a determination of which mandatory OACIQ form applies. */
export type DealWorkflowHint = {
  packageKey: string;
  confidence: number;
  reasons: string[];
  disclaimer: string;
};

export type DealChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
};

export type DealTimelineEntry = {
  id: string;
  at: string;
  kind: "milestone" | "document" | "audit" | "suggestion";
  title: string;
  detail?: string;
};
