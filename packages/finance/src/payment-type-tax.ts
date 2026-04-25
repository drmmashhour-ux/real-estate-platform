import type { PlatformFinancialSettings } from "@prisma/client";

export type PaymentTypeTaxRule = {
  taxPlatform?: boolean;
  taxBroker?: boolean;
};

export type TaxOverrideInput = {
  applyTaxToPlatformServices?: boolean;
  applyTaxToBrokerCommissions?: boolean;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Optional JSON on PlatformFinancialSettings: { "booking": { "taxPlatform": true, "taxBroker": false } } */
export function parsePaymentTypeTaxOverrides(json: unknown): Record<string, PaymentTypeTaxRule> {
  const o = asRecord(json);
  if (!o) return {};
  const out: Record<string, PaymentTypeTaxRule> = {};
  for (const [k, v] of Object.entries(o)) {
    const r = asRecord(v);
    if (!r) continue;
    const rule: PaymentTypeTaxRule = {};
    if (typeof r.taxPlatform === "boolean") rule.taxPlatform = r.taxPlatform;
    if (typeof r.taxBroker === "boolean") rule.taxBroker = r.taxBroker;
    if (Object.keys(rule).length) out[k] = rule;
  }
  return out;
}

export function parseTaxOverrideFromPayment(json: unknown): TaxOverrideInput | null {
  const o = asRecord(json);
  if (!o) return null;
  const out: TaxOverrideInput = {};
  if (typeof o.applyTaxToPlatformServices === "boolean") {
    out.applyTaxToPlatformServices = o.applyTaxToPlatformServices;
  }
  if (typeof o.applyTaxToBrokerCommissions === "boolean") {
    out.applyTaxToBrokerCommissions = o.applyTaxToBrokerCommissions;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Effective GST/QST application for a payment type — never blindly global.
 * Order: per-type JSON overrides → global settings → payment-level admin override.
 */
export function resolveTaxFlagsForPaymentType(params: {
  settings: PlatformFinancialSettings;
  paymentType: string;
  taxOverrideJson?: unknown;
}): {
  applyTaxToPlatformServices: boolean;
  applyTaxToBrokerCommissions: boolean;
  resolvedFrom: { typeKey: string; typeRule?: PaymentTypeTaxRule; override?: TaxOverrideInput | null };
} {
  const typeKey = params.paymentType?.trim() || "unknown";
  const overrides = parsePaymentTypeTaxOverrides(params.settings.paymentTypeTaxOverrides);
  const typeRule = overrides[typeKey];
  let applyPlatform = params.settings.applyTaxToPlatformServices;
  let applyBroker = params.settings.applyTaxToBrokerCommissions;
  if (typeRule?.taxPlatform !== undefined) applyPlatform = typeRule.taxPlatform;
  if (typeRule?.taxBroker !== undefined) applyBroker = typeRule.taxBroker;

  const ovr = parseTaxOverrideFromPayment(params.taxOverrideJson);
  if (ovr?.applyTaxToPlatformServices !== undefined) applyPlatform = ovr.applyTaxToPlatformServices;
  if (ovr?.applyTaxToBrokerCommissions !== undefined) applyBroker = ovr.applyTaxToBrokerCommissions;

  return {
    applyTaxToPlatformServices: applyPlatform,
    applyTaxToBrokerCommissions: applyBroker,
    resolvedFrom: { typeKey, typeRule, override: ovr },
  };
}
