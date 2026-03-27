import type { PlatformFinancialSettings } from "@prisma/client";
import { calculateTaxForAmount, type TaxMode, quebecRetailTaxRates } from "@/lib/tax/quebec-tax-engine";
import type { BrokerTaxSnapshotJson } from "@/lib/tax/broker-tax-snapshot";
import {
  buildInvoiceTaxDetails,
  buildBrokerCommissionIssuerTaxDetails,
  type InvoiceTaxBreakdownJson,
} from "@/lib/tax/platform-invoice-tax";
import { resolveTaxFlagsForPaymentType } from "./payment-type-tax";

export type InvoiceLineJson = {
  description: string;
  party: "PLATFORM" | "BROKER";
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  lineTotalCents: number;
  taxApplied: boolean;
};

export type BuiltInvoicePayload = {
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  totalCents: number;
  invoiceLines: InvoiceLineJson[];
  taxMode: TaxMode;
  invoiceTaxDetails: ReturnType<typeof buildInvoiceTaxDetails>;
  taxCalculationJson: Record<string, unknown>;
};

export type IssuerInvoiceCreateInput = {
  invoiceIssuer: "PLATFORM" | "BROKER";
  invoiceLabel: string;
  userId: string;
  invoiceNumber: string;
  amountCents: number;
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  totalCents: number;
  invoiceLines: InvoiceLineJson[];
  taxMode: TaxMode;
  invoiceTaxDetails: object;
};

function filterBreakdownByParty(
  bd: InvoiceTaxBreakdownJson,
  party: "PLATFORM" | "BROKER"
): InvoiceTaxBreakdownJson {
  const lines = bd.lines.filter((l) => l.party === party);
  const combinedSubtotalCents = lines.reduce((s, l) => s + l.subtotalCents, 0);
  const combinedGstCents = lines.reduce((s, l) => s + l.gstCents, 0);
  const combinedQstCents = lines.reduce((s, l) => s + l.qstCents, 0);
  const partTotal = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  return {
    ...bd,
    lines,
    combinedSubtotalCents,
    combinedGstCents,
    combinedQstCents,
    chargedTotalCents: partTotal,
  };
}

/**
 * Build GST/QST breakdown per revenue party (combined calculation for audit JSON).
 * **No double taxation** on the same dollars — see `resolveTaxFlagsForPaymentType` for per-type / override rules.
 */
export function buildInvoiceForPlatformPayment(params: {
  stripeAmountCents: number;
  platformAmountCents: number;
  brokerAmountCents: number;
  paymentType: string;
  settings: PlatformFinancialSettings;
  taxMode: TaxMode;
  brokerTaxSnapshot: BrokerTaxSnapshotJson | null;
  platformTaxNote: string | null;
  currency?: string;
  /** Admin/accountant JSON on payment — overrides per-side tax application. */
  taxOverrideJson?: unknown | null;
}): BuiltInvoicePayload {
  /** Aligned with BNHub lodging tax: statutory Québec GST + QST via `quebec-tax-engine`. */
  const { gstRate, qstRate } = quebecRetailTaxRates();
  const { applyTaxToPlatformServices, applyTaxToBrokerCommissions, resolvedFrom } = resolveTaxFlagsForPaymentType({
    settings: params.settings,
    paymentType: params.paymentType,
    taxOverrideJson: params.taxOverrideJson,
  });

  const currency = (params.currency ?? "cad").toUpperCase();
  const lines: InvoiceLineJson[] = [];
  let sumSub = 0;
  let sumGst = 0;
  let sumQst = 0;

  const addLine = (description: string, party: "PLATFORM" | "BROKER", amountCents: number, applyTax: boolean) => {
    if (amountCents <= 0) return;
    if (!applyTax) {
      lines.push({
        description,
        party,
        subtotalCents: amountCents,
        gstCents: 0,
        qstCents: 0,
        lineTotalCents: amountCents,
        taxApplied: false,
      });
      sumSub += amountCents;
      return;
    }
    const t = calculateTaxForAmount({
      amountCents: amountCents,
      mode: params.taxMode,
      gstRate,
      qstRate,
    });
    lines.push({
      description,
      party,
      subtotalCents: t.subtotalCents,
      gstCents: t.gstCents,
      qstCents: t.qstCents,
      lineTotalCents: t.totalCents,
      taxApplied: true,
    });
    sumSub += t.subtotalCents;
    sumGst += t.gstCents;
    sumQst += t.qstCents;
  };

  const platDesc =
    params.paymentType === "booking"
      ? "Platform service fee (booking)"
      : params.paymentType === "subscription"
        ? "Platform subscription / service"
        : params.paymentType === "lead_unlock"
          ? "Platform lead service"
          : params.paymentType === "mortgage_contact_unlock"
            ? "Mortgage lead contact unlock"
            : params.paymentType === "deposit"
            ? "Platform share — deal deposit"
            : params.paymentType === "closing_fee"
              ? "Platform share — closing"
              : params.paymentType === "featured_listing"
                ? "Featured listing service"
                : params.paymentType === "fsbo_publish"
                  ? "FSBO listing publish fee"
                  : `Platform — ${params.paymentType}`;

  const brokerDesc =
    params.paymentType === "deposit" || params.paymentType === "closing_fee"
      ? "Broker commission (deal)"
      : params.paymentType === "lead_unlock"
        ? "Broker commission (lead)"
        : `Broker revenue — ${params.paymentType}`;

  addLine(platDesc, "PLATFORM", params.platformAmountCents, applyTaxToPlatformServices);
  addLine(brokerDesc, "BROKER", params.brokerAmountCents, applyTaxToBrokerCommissions);

  const computedTotal = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const diff = params.stripeAmountCents - computedTotal;

  const platformLine = lines.find((l) => l.party === "PLATFORM");
  const brokerLine = lines.find((l) => l.party === "BROKER");

  const settlementTrace = {
    totalPaidCents: params.stripeAmountCents,
    platformFeeComponentCents: params.platformAmountCents,
    brokerCommissionComponentCents: params.brokerAmountCents,
    platformGstCents: platformLine?.gstCents ?? 0,
    platformQstCents: platformLine?.qstCents ?? 0,
    brokerGstCents: brokerLine?.gstCents ?? 0,
    brokerQstCents: brokerLine?.qstCents ?? 0,
    platformLineTotalCents: platformLine?.lineTotalCents ?? 0,
    brokerLineTotalCents: brokerLine?.lineTotalCents ?? 0,
    /** Trace only — actual payout batches use BrokerPayout / commission rules. */
    brokerAttributedSettlementCents: brokerLine?.lineTotalCents ?? 0,
    taxResolution: resolvedFrom,
  };

  const taxCalculationJson: Record<string, unknown> = {
    stripeAmountCents: params.stripeAmountCents,
    computedTotalCents: computedTotal,
    differenceCents: diff,
    gstRate,
    qstRate,
    taxMode: params.taxMode,
    lines,
    settlementTrace,
    note:
      Math.abs(diff) > 2
        ? "Computed tax lines may not match Stripe total — reconcile manually. Sums are based on configured rates and exclusive/inclusive mode."
        : undefined,
  };

  const taxBreakdown: InvoiceTaxBreakdownJson = {
    currency,
    taxMode: params.taxMode,
    gstRatePercent: gstRate * 100,
    qstRatePercent: qstRate * 100,
    combinedSubtotalCents: sumSub,
    combinedGstCents: sumGst,
    combinedQstCents: sumQst,
    chargedTotalCents: params.stripeAmountCents,
    lines: lines.map((l) => ({
      party: l.party,
      description: l.description,
      subtotalCents: l.subtotalCents,
      gstCents: l.gstCents,
      qstCents: l.qstCents,
      lineTotalCents: l.lineTotalCents,
      taxApplied: l.taxApplied,
    })),
  };

  const invoiceTaxDetails = buildInvoiceTaxDetails(
    params.brokerTaxSnapshot,
    params.platformTaxNote,
    params.settings.legalName,
    params.settings.platformGstNumber,
    params.settings.platformQstNumber,
    taxBreakdown
  );

  return {
    subtotalCents: sumSub,
    gstCents: sumGst,
    qstCents: sumQst,
    totalCents: params.stripeAmountCents,
    invoiceLines: lines,
    taxMode: params.taxMode,
    invoiceTaxDetails,
    taxCalculationJson,
  };
}

/**
 * Two issuer records: platform (payer) and broker (commission recipient). Never merged into one row.
 */
export function buildSplitIssuerInvoiceRecords(params: {
  combined: BuiltInvoicePayload;
  settings: PlatformFinancialSettings;
  brokerTaxSnapshot: BrokerTaxSnapshotJson | null;
  platformTaxNote: string | null;
  payerUserId: string;
  brokerUserId: string | null;
  paymentId: string;
  currency: string;
  year: number;
  /** When omitted, uses stable fallback from payment id (legacy / tests). Prefer DB `generateInvoiceNumber`. */
  platformInvoiceNumber?: string;
  brokerInvoiceNumber?: string;
}): { platform?: IssuerInvoiceCreateInput; broker?: IssuerInvoiceCreateInput } {
  const { combined, settings } = params;
  const lines = combined.invoiceLines;
  const platformLine = lines.find((l) => l.party === "PLATFORM");
  const brokerLine = lines.find((l) => l.party === "BROKER");
  const base = params.paymentId.replace(/-/g, "").slice(0, 8).toUpperCase();

  const fullBd = combined.invoiceTaxDetails.platform?.taxBreakdown;
  if (!fullBd) {
    return {};
  }

  const out: { platform?: IssuerInvoiceCreateInput; broker?: IssuerInvoiceCreateInput } = {};

  if (platformLine && platformLine.lineTotalCents > 0) {
    const bd = filterBreakdownByParty(fullBd, "PLATFORM");
    const taxDetails = buildInvoiceTaxDetails(
      null,
      params.platformTaxNote,
      settings.legalName,
      settings.platformGstNumber,
      settings.platformQstNumber,
      bd
    );
    out.platform = {
      invoiceIssuer: "PLATFORM",
      invoiceLabel: "Platform service invoice (GST/QST where applicable)",
      userId: params.payerUserId,
      invoiceNumber: params.platformInvoiceNumber ?? `INV-P-${params.year}-${base}`,
      amountCents: platformLine.lineTotalCents,
      subtotalCents: platformLine.subtotalCents,
      gstCents: platformLine.gstCents,
      qstCents: platformLine.qstCents,
      totalCents: platformLine.lineTotalCents,
      invoiceLines: [platformLine],
      taxMode: combined.taxMode,
      invoiceTaxDetails: { ...taxDetails, invoiceIssuerRole: "PLATFORM_ISSUER" as const },
    };
  }

  if (
    brokerLine &&
    brokerLine.lineTotalCents > 0 &&
    params.brokerUserId &&
    params.brokerTaxSnapshot
  ) {
    const bd = filterBreakdownByParty(fullBd, "BROKER");
    const taxDetails = buildBrokerCommissionIssuerTaxDetails(
      params.brokerTaxSnapshot,
      settings.legalName,
      params.platformTaxNote,
      bd
    );
    out.broker = {
      invoiceIssuer: "BROKER",
      invoiceLabel: "Broker commission invoice (GST/QST where applicable)",
      userId: params.brokerUserId,
      invoiceNumber: params.brokerInvoiceNumber ?? `INV-B-${params.year}-${base}`,
      amountCents: brokerLine.lineTotalCents,
      subtotalCents: brokerLine.subtotalCents,
      gstCents: brokerLine.gstCents,
      qstCents: brokerLine.qstCents,
      totalCents: brokerLine.lineTotalCents,
      invoiceLines: [brokerLine],
      taxMode: combined.taxMode,
      invoiceTaxDetails: { ...taxDetails, invoiceIssuerRole: "BROKER_ISSUER" as const },
    };
  }

  return out;
}
