/**
 * Quebec / Canada broker tax number format checks only.
 * Does NOT verify with CRA or Revenu Québec.
 */

export const TAX_DISCLAIMER =
  "Tax numbers are provided by the broker. The platform does not guarantee their validity with Revenu Québec or the CRA. Numbers are format-checked only — not government-verified.";

/** 9-digit Business Number (BN) */
export const BN_NINE_REGEX = /^\d{9}$/;

/** GST/HST registration: 9-digit BN + RT + 4-digit reference */
export const GST_NUMBER_REGEX = /^\d{9}RT\d{4}$/i;

/** Québec QST: 10 digits + TQ + 4 digits (common Revenu Québec format) */
export const QST_NUMBER_REGEX = /^\d{10}TQ\d{4}$/i;

export function normalizeDigits(input: string): string {
  return input.replace(/\s/g, "").trim();
}

export function isValidBusinessNumberNine(value: string): boolean {
  return BN_NINE_REGEX.test(normalizeDigits(value));
}

export function isValidGstNumber(value: string | null | undefined): boolean {
  if (value == null || value.trim() === "") return true; // optional
  return GST_NUMBER_REGEX.test(normalizeDigits(value));
}

export function isValidQstNumber(value: string | null | undefined): boolean {
  if (value == null || value.trim() === "") return false;
  return QST_NUMBER_REGEX.test(normalizeDigits(value));
}

export type BrokerTaxFormInput = {
  legalName: string;
  businessName?: string | null;
  businessNumberNine: string;
  gstNumber?: string | null;
  qstNumber?: string | null;
  businessAddress: string;
  province: string;
};

export type BrokerTaxValidationResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export function validateBrokerTaxForm(input: BrokerTaxFormInput): BrokerTaxValidationResult {
  const errors: Record<string, string> = {};
  const province = (input.province || "QC").toUpperCase();

  if (!input.legalName?.trim()) errors.legalName = "Legal name is required.";
  if (!input.businessAddress?.trim()) errors.businessAddress = "Business address is required.";

  const bn = normalizeDigits(input.businessNumberNine || "");
  if (!isValidBusinessNumberNine(bn)) {
    errors.businessNumberNine = "Business Number must be exactly 9 digits.";
  }

  const gst = input.gstNumber?.trim() ? normalizeDigits(input.gstNumber) : "";
  if (gst && !GST_NUMBER_REGEX.test(gst)) {
    errors.gstNumber = "GST number must look like 123456789RT0001 (9 digits + RT + 4 digits).";
  }

  const qst = input.qstNumber?.trim() ? normalizeDigits(input.qstNumber) : "";
  if (province === "QC") {
    if (!qst) {
      errors.qstNumber = "QST number is required for Quebec (format: 1234567890TQ0001).";
    } else if (!QST_NUMBER_REGEX.test(qst)) {
      errors.qstNumber = "QST number must look like 1234567890TQ0001 (10 digits + TQ + 4 digits).";
    }
  } else if (qst && !QST_NUMBER_REGEX.test(qst)) {
    errors.qstNumber = "If provided, QST number must match format 1234567890TQ0001.";
  }

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
