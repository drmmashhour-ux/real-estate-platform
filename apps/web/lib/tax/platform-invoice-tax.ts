import type { BrokerTaxSnapshotJson } from "./broker-tax-snapshot";
import { TAX_DISCLAIMER } from "./quebec-broker-tax";
import type { TaxMode } from "./quebec-tax-engine";

/** Per-invoice GST/QST breakdown (platform vs broker slices — never summed twice on the same dollars). */
export type InvoiceTaxBreakdownJson = {
  currency: string;
  taxMode: TaxMode;
  gstRatePercent: number;
  qstRatePercent: number;
  combinedSubtotalCents: number;
  combinedGstCents: number;
  combinedQstCents: number;
  /** Stripe charge total — authoritative cash collected */
  chargedTotalCents: number;
  lines: Array<{
    party: "PLATFORM" | "BROKER";
    description: string;
    subtotalCents: number;
    gstCents: number;
    qstCents: number;
    lineTotalCents: number;
    taxApplied: boolean;
  }>;
};

export type InvoiceTaxDetailsJson = {
  /** Present on persisted JSON for split invoices — UI/PDF labeling */
  invoiceIssuerRole?: "PLATFORM_ISSUER" | "BROKER_ISSUER";
  broker?: {
    legalName: string;
    businessName: string | null;
    businessNumberNine: string;
    gstNumber: string | null;
    qstNumber: string | null;
    businessAddress: string;
    province: string;
    reviewStatus: string;
  };
  platform?: {
    legalName?: string | null;
    gstNumber?: string | null;
    qstNumber?: string | null;
    note: string | null;
    /** When present, use for display/PDF — reflects split taxation rules */
    taxBreakdown?: InvoiceTaxBreakdownJson | null;
  };
  disclaimer: string;
};

/**
 * Broker-issued commission invoice: broker GST/QST on file + commission breakdown only.
 * Platform appears only as facilitator reference (not as supplier of the broker’s professional service).
 */
export function buildBrokerCommissionIssuerTaxDetails(
  snapshot: BrokerTaxSnapshotJson,
  facilitatorLegalName: string | null | undefined,
  facilitatorNote: string | null,
  taxBreakdown: InvoiceTaxBreakdownJson | null
): InvoiceTaxDetailsJson {
  const broker = {
    legalName: snapshot.legalName,
    businessName: snapshot.businessName,
    businessNumberNine: snapshot.businessNumberNine,
    gstNumber: snapshot.gstNumber,
    qstNumber: snapshot.qstNumber,
    businessAddress: snapshot.businessAddress,
    province: snapshot.province,
    reviewStatus: snapshot.registrationStatus,
  };
  const note =
    facilitatorNote ??
    (facilitatorLegalName
      ? `Payment processed via ${facilitatorLegalName}. This document reflects your commission component only.`
      : "Payment processed via platform. This document reflects your commission component only.");
  return {
    broker,
    platform: {
      legalName: facilitatorLegalName ?? null,
      gstNumber: null,
      qstNumber: null,
      note,
      taxBreakdown: taxBreakdown ?? undefined,
    },
    disclaimer: TAX_DISCLAIMER,
  };
}

export function buildInvoiceTaxDetails(
  snapshot: BrokerTaxSnapshotJson | null,
  platformNote: string | null,
  platformLegalName?: string | null,
  platformGst?: string | null,
  platformQst?: string | null,
  taxBreakdown?: InvoiceTaxBreakdownJson | null
): InvoiceTaxDetailsJson {
  const broker =
    snapshot != null
      ? {
          legalName: snapshot.legalName,
          businessName: snapshot.businessName,
          businessNumberNine: snapshot.businessNumberNine,
          gstNumber: snapshot.gstNumber,
          qstNumber: snapshot.qstNumber,
          businessAddress: snapshot.businessAddress,
          province: snapshot.province,
          reviewStatus: snapshot.registrationStatus,
        }
      : undefined;

  return {
    broker,
    platform: {
      legalName: platformLegalName ?? null,
      gstNumber: platformGst ?? null,
      qstNumber: platformQst ?? null,
      note: platformNote,
      taxBreakdown: taxBreakdown ?? undefined,
    },
    disclaimer: TAX_DISCLAIMER,
  };
}
