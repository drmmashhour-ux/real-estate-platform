import type { BrokerageCommissionSplitCategory, BrokerageSplitPayeeKind } from "@prisma/client";

export type CommissionRuleConfigV1 = {
  version: 1;
  /** Percent of gross retained by brokerage office (integer 0–100). */
  officeSharePercent: number;
  /** Portion of remainder after office take assigned to listing broker (0–100). */
  brokerShareOfRemainderPercent: number;
  /** Optional linear deductions before or after split — documented in explanation. */
  deductions?: Array<{
    key: string;
    label: string;
    /** basis: gross | remainder_after_office */
    basis: "gross" | "remainder_after_office";
    /** Basis points of chosen basis (10000 = 100%). */
    basisPoints: number;
  }>;
};

export type CommissionCalculationOutput = {
  grossCommissionCents: number;
  officeShareCents: number;
  brokerShareCents: number;
  deductions: Array<{ key: string; label: string; amountCents: number }>;
  netBrokerPayoutCents: number;
  warnings: string[];
  explanation: string[];
};

export type SplitLineInput = {
  splitCategory: BrokerageCommissionSplitCategory;
  payeeKind: BrokerageSplitPayeeKind;
  payeeUserId?: string | null;
  payeeExternalName?: string | null;
  amountCents: number;
  percentage?: number | null;
  notes?: Record<string, unknown>;
};
