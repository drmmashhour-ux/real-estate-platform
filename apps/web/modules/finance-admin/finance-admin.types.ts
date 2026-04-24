import type {
  FinAdminDomain,
  FinLedgerEntryType,
  RegulatoryAuthority,
} from "@prisma/client";

export type FinanceHubOverview = {
  cashSummaryByDomain: Record<string, { inflow: string; outflow: string; net: string }>;
  taxSummary: {
    gstCollected: string;
    qstCollected: string;
    gstPaid: string;
    qstPaid: string;
    netGst: string;
    netQst: string;
    filingNote: string;
  };
  obligationsDueSoon: Array<{
    id: string;
    authority: RegulatoryAuthority;
    obligationType: string;
    dueDate: string;
    status: string;
    amountEstimate: string | null;
  }>;
  alignmentNote: string;
};

export type CreateHubLedgerEntryInput = {
  accountId: string;
  domain: FinAdminDomain;
  entryType: FinLedgerEntryType;
  referenceType: string;
  referenceId?: string | null;
  amount: string;
  taxExclusiveAmount?: string | null;
  gstAmount?: string | null;
  qstAmount?: string | null;
  effectiveDate: Date;
  counterpartyId?: string | null;
  notes?: Record<string, unknown> | null;
};

export const FINANCE_HUB_DISCLAIMERS = {
  notAdvice:
    "Operational summaries only — not tax or legal advice. Property sale tax treatment depends on asset facts; do not rely on global hard-coded rules.",
  noPublicOffering:
    "Default investment mode is private exempt placement — no public securities offering workflow unless counsel enables additional exemptions.",
  noGuarantee:
    "No guaranteed returns. Past performance does not predict future results.",
} as const;
