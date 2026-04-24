import type { CashReceiptForm } from "@/modules/compliance/forms/cash-receipt.schema";
import { randomUUID } from "crypto";

/** Builds immutable JSON snapshot for official cash receipt (PDF generation is a separate renderer). */
export function createCashReceiptDraft(input: Omit<CashReceiptForm, "receiptId">): CashReceiptForm {
  return {
    receiptId: randomUUID(),
    ...input,
  };
}

export function serializeComplianceDocument(form: CashReceiptForm): string {
  return JSON.stringify(form);
}
