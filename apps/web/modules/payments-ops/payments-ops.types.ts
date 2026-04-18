import type {
  LecipmLedgerEntryKind,
  LecipmPaymentConfirmationKind,
  LecipmPaymentKind,
  LecipmPaymentRecordStatus,
  LecipmTrustWorkflowMode,
  LecipmTrustWorkflowStatus,
} from "@prisma/client";

export type {
  LecipmLedgerEntryKind,
  LecipmPaymentConfirmationKind,
  LecipmPaymentKind,
  LecipmPaymentRecordStatus,
  LecipmTrustWorkflowMode,
  LecipmTrustWorkflowStatus,
};

/** Execution mode — UI must disclose; LECIPM does not hold funds unless a real provider integration exists. */
export type TrustExecutionMode = LecipmTrustWorkflowMode;

export type PaymentOpsSummary = {
  disclaimer: string;
  mode: LecipmTrustWorkflowMode | null;
  trustStatus: LecipmTrustWorkflowStatus | null;
  payments: { id: string; kind: LecipmPaymentKind; status: LecipmPaymentRecordStatus; amountCents: number }[];
};
