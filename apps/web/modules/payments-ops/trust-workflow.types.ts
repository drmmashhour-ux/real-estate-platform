import type { LecipmTrustWorkflowMode, LecipmTrustWorkflowStatus } from "@prisma/client";

export type TrustWorkflowUpsertInput = {
  dealId: string;
  mode: LecipmTrustWorkflowMode;
  status?: LecipmTrustWorkflowStatus;
  trusteeName?: string | null;
  trusteeType?: string | null;
  trustAccountReference?: string | null;
  notes?: unknown[];
};
