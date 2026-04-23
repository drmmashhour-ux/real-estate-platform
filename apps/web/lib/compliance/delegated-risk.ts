/**
 * When a delegated / supervised workflow triggers a compliance violation, risk attribution follows the accountable actor (not the keystroke actor).
 */
export function riskOwnerForDelegatedViolation(accountableActorId: string): string {
  return accountableActorId;
}
