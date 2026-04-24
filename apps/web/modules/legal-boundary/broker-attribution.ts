/**
 * Public broker attribution for contracts, offers, invoices (OACIQ accountability).
 * Configure via environment — do not commit licence holder PII as source literals.
 */
export type LecipmBrokerAttribution = {
  legalName: string;
  licenceNumber: string;
  email: string;
  addressLine: string;
  gstRegistration: string;
  qstRegistration: string;
};

function pick(...vals: Array<string | undefined>): string {
  for (const v of vals) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

/**
 * Returns attribution when required env vars are set; otherwise null (callers should block brokered doc generation in prod).
 */
export function getLecipmBrokerAttributionFromEnv(): LecipmBrokerAttribution | null {
  const legalName = pick(
    process.env.LECIPM_PUBLIC_BROKER_LEGAL_NAME,
    process.env.NEXT_PUBLIC_LECIPM_BROKER_LEGAL_NAME,
  );
  const licenceNumber = pick(
    process.env.LECIPM_PUBLIC_BROKER_LICENCE_NO,
    process.env.LECIPM_PUBLIC_BROKER_LICENSE_NO,
    process.env.NEXT_PUBLIC_LECIPM_BROKER_LICENCE_NO,
  );
  if (!legalName || !licenceNumber) return null;

  return {
    legalName,
    licenceNumber,
    email: pick(process.env.LECIPM_PUBLIC_BROKER_EMAIL, process.env.NEXT_PUBLIC_LECIPM_BROKER_EMAIL),
    addressLine: pick(
      process.env.LECIPM_PUBLIC_BROKER_ADDRESS_LINE,
      process.env.NEXT_PUBLIC_LECIPM_BROKER_ADDRESS_LINE,
    ),
    gstRegistration: pick(
      process.env.LECIPM_PUBLIC_BROKER_GST,
      process.env.NEXT_PUBLIC_LECIPM_BROKER_GST,
    ),
    qstRegistration: pick(
      process.env.LECIPM_PUBLIC_BROKER_QST,
      process.env.NEXT_PUBLIC_LECIPM_BROKER_QST,
    ),
  };
}

/** Default broker user id to assign on FSBO → broker conversion (server env only). */
export function getLecipmDefaultBrokerUserId(): string | null {
  const id = process.env.LECIPM_DEFAULT_BROKER_USER_ID?.trim();
  return id || null;
}

/** Merge broker-of-record attribution into form / contract fact payloads (when env is configured). */
export function mergeBrokerAttributionIntoFacts<T extends Record<string, unknown>>(facts: T): T & Record<string, string> {
  const a = getLecipmBrokerAttributionFromEnv();
  if (!a) return { ...facts, lecipmBrokerAttributionConfigured: "false" };
  return {
    ...facts,
    lecipmBrokerAttributionConfigured: "true",
    lecipmBrokerLegalName: a.legalName,
    lecipmBrokerLicenceNo: a.licenceNumber,
    lecipmBrokerEmail: a.email,
    lecipmBrokerAddress: a.addressLine,
    lecipmBrokerGst: a.gstRegistration,
    lecipmBrokerQst: a.qstRegistration,
  };
}
