import "server-only";

export type BrokerMandatoryDisclosureStatus = {
  provided: boolean;
};

export async function getBrokerDisclosureStatusForDeal(_dealId: string): Promise<BrokerMandatoryDisclosureStatus> {
  return { provided: false };
}

export function mandatoryBrokerDisclosureEnforced(): boolean {
  const v = process.env.LECIPM_OACIQ_MANDATORY_BROKER_DISCLOSURE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
