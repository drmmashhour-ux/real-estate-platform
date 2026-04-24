import { FINANCIAL_CONFIG, formatFinancialBusinessAddress } from "@/config/financial";

function roundCurrencyMajorUnits(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export type InvoiceTotals = {
  subtotal: number;
  gst: number;
  qst: number;
  total: number;
};

/**
 * Tax-exclusive subtotal in major units (e.g. CAD dollars). Returns GST/QST/total in the same units.
 */
export function calculateInvoiceTotals(subtotal: number): InvoiceTotals {
  const base = roundCurrencyMajorUnits(subtotal);
  const gst = roundCurrencyMajorUnits(base * FINANCIAL_CONFIG.tax.gst.rate);
  const qst = roundCurrencyMajorUnits(base * FINANCIAL_CONFIG.tax.qst.rate);
  const total = roundCurrencyMajorUnits(base + gst + qst);

  return {
    subtotal: base,
    gst,
    qst,
    total,
  };
}

export type InvoiceSellerMeta = {
  businessName: string;
  address: string;
  gstNumber: string;
  qstNumber: string;
};

/** Seller / supplier block for invoices (Québec GST + QST registration). */
export function generateInvoiceMeta(): InvoiceSellerMeta {
  return {
    businessName: FINANCIAL_CONFIG.business.legalName,
    address: formatFinancialBusinessAddress(),
    gstNumber: FINANCIAL_CONFIG.tax.gst.number,
    qstNumber: FINANCIAL_CONFIG.tax.qst.number,
  };
}
