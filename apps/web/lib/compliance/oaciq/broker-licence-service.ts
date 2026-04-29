import "server-only";

export type BrokerLicenceEvaluation = {
  allowed: boolean;
  uiStatus: "verified" | "warning" | "blocked";
  label: string;
  warnings: string[];
  reasons: string[];
};

/**
 * Lightweight placeholder until OACIQ licence verification is wired to CRM rows.
 */
export async function getBrokerLicenceDisplay(_brokerId: string): Promise<BrokerLicenceEvaluation | null> {
  return null;
}
