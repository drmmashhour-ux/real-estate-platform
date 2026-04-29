import "server-only";

export function assertBrokerLicence() {
  return true;
}

export type LicenceGuardContext = Record<string, unknown>;

/** Allow-through stub — replace with CRM/OACIQ checks when wired. */
export async function requireActiveResidentialBrokerLicence(
  _userId: string,
  _ctx?: LicenceGuardContext,
): Promise<import("next/server").NextResponse | null> {
  return null;
}
