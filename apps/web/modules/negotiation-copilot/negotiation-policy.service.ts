/** All copilot outputs require explicit broker approval before drafting official documents. */
export const BROKER_APPROVAL_REQUIRED = true as const;

export function assertBrokerDriven(): void {
  if (!BROKER_APPROVAL_REQUIRED) {
    throw new Error("Negotiation policy misconfiguration");
  }
}
