import { prisma } from "@/lib/db";
import { logTaxTagged } from "@/lib/server/launch-logger";

export type TaxLogTransactionType = "booking" | "subscription" | "fsbo";

export type LogTransactionWithTaxInput = {
  /** Taxable base / charge amount in Canadian dollars (major units). */
  amount: number;
  /** GST portion in Canadian dollars (major units). */
  gst: number;
  /** QST portion in Canadian dollars (major units). */
  qst: number;
  type: TaxLogTransactionType;
  /** Optional platform reference (booking id, invoice id, etc.). */
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
};

function dollarsToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Structured tax logging: emits `[tax]` line (redacted in prod) and persists a row to `tax_reports`.
 * Never throws — failures are logged only.
 */
export function logTransactionWithTax(data: LogTransactionWithTaxInput): void {
  const timestamp = new Date().toISOString();
  const payload = {
    type: data.type,
    amount: data.amount,
    gst: data.gst,
    qst: data.qst,
    sourceId: data.sourceId ?? undefined,
    timestamp,
  };

  logTaxTagged.info("transaction_tax", payload);

  const amountCents = dollarsToCents(data.amount);
  const gstCents = dollarsToCents(data.gst);
  const qstCents = dollarsToCents(data.qst);

  void prisma.taxReport
    .create({
      data: {
        sourceType: data.type,
        sourceId: data.sourceId?.trim() || null,
        amountCents,
        gstCents,
        qstCents,
        metadata: data.metadata ? (data.metadata as object) : undefined,
      },
    })
    .catch((e) => {
      logTaxTagged.error("tax_report_persist_failed", {
        message: e instanceof Error ? e.message : String(e),
        type: data.type,
        timestamp,
      });
    });
}
