export type TrustLedgerEntryForm = {
  entryId: string;
  trustAccountId: string;
  contractId?: string | null;
  dealId?: string | null;

  direction: "deposit" | "withdrawal" | "refund" | "transfer";
  amount: number;
  currency: "CAD";

  payerName?: string;
  beneficiaryName?: string;
  legalPurpose: string;

  createdAt: string;
  createdByBrokerId: string;
};
