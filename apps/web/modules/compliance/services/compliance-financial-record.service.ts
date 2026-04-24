import { randomUUID } from "crypto";
import { writeComplianceEvaluationAudit } from "@/modules/compliance/core/audit-log";

export type FinancialComplianceRecord = {
  recordId: string;
  dealId?: string;
  contractId?: string;
  clientId?: string;

  category:
    | "deposit"
    | "commission"
    | "refund"
    | "trust_receipt"
    | "trust_withdrawal"
    | "tax_invoice";

  amount: number;
  currency: "CAD";

  gst?: number;
  qst?: number;
  total?: number;

  payerName?: string;
  beneficiaryName?: string;

  paymentMethod?: "cash" | "wire" | "cheque";

  trustAccountRelated: boolean;
  supportingDocumentIds: string[];
  createdAt: string;
};

const store = new Map<string, FinancialComplianceRecord>();

export function createFinancialComplianceRecord(
  input: Omit<FinancialComplianceRecord, "recordId" | "createdAt">,
): FinancialComplianceRecord {
  const row: FinancialComplianceRecord = {
    ...input,
    recordId: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  store.set(row.recordId, row);
  return row;
}

export function getFinancialComplianceRecord(recordId: string): FinancialComplianceRecord | undefined {
  return store.get(recordId);
}

export async function persistFinancialRecordAudit(input: {
  ownerType: string;
  ownerId: string;
  caseId: string;
  actorId: string;
  record: FinancialComplianceRecord;
}): Promise<void> {
  await writeComplianceEvaluationAudit({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    caseId: input.caseId,
    actorId: input.actorId,
    actorType: "broker",
    action: "record_created",
    details: { record: input.record },
  });
}
