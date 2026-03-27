import type { BrokerTaxRegistration, BrokerTaxRegistrationStatus } from "@prisma/client";
import { TAX_DISCLAIMER, validateBrokerTaxForm } from "./quebec-broker-tax";

export type BrokerTaxSnapshotJson = {
  legalName: string;
  businessName: string | null;
  businessNumberNine: string;
  gstNumber: string | null;
  qstNumber: string | null;
  businessAddress: string;
  province: string;
  registrationStatus: BrokerTaxRegistrationStatus;
  capturedAt: string;
  formatValidatedAtCapture: boolean;
  disclaimer: string;
};

/** Build JSON to store on PlatformPayment when a broker is linked. No government verification. */
export function registrationToSnapshot(reg: BrokerTaxRegistration, formatOk: boolean): BrokerTaxSnapshotJson {
  return {
    legalName: reg.legalName,
    businessName: reg.businessName ?? null,
    businessNumberNine: reg.businessNumberNine,
    gstNumber: reg.gstNumber ?? null,
    qstNumber: reg.qstNumber ?? null,
    businessAddress: reg.businessAddress,
    province: reg.province,
    registrationStatus: reg.status,
    capturedAt: new Date().toISOString(),
    formatValidatedAtCapture: formatOk,
    disclaimer: TAX_DISCLAIMER,
  };
}

export function isRegistrationFormatValid(reg: BrokerTaxRegistration): boolean {
  return validateBrokerTaxForm({
    legalName: reg.legalName,
    businessName: reg.businessName,
    businessNumberNine: reg.businessNumberNine,
    gstNumber: reg.gstNumber,
    qstNumber: reg.qstNumber,
    businessAddress: reg.businessAddress,
    province: reg.province,
  }).ok;
}
