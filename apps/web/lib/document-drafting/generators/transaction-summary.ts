import { getTransactionClosingContext } from "@/lib/notary-closing/transaction-data";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { TRANSACTION_SUMMARY_TEMPLATE } from "../templates/transaction-summary";

export async function generateTransactionSummaryDraft(transactionId: string) {
  const result = await getTransactionClosingContext(transactionId);
  if (!result) throw new Error("Transaction not found");
  const { context } = result;
  const validation = validateContext(
    context as Record<string, unknown>,
    REQUIRED_BY_DOCUMENT_TYPE.transaction_summary
  );
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(TRANSACTION_SUMMARY_TEMPLATE, context as Record<string, unknown>);
  return {
    html,
    context,
    signatureFields: [] as Array<{ signerRole: string; signerName: string; signerEmail: string }>,
  };
}
