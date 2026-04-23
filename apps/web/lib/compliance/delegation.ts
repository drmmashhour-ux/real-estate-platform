export type DelegationValidationResult =
  | { allowed: true; requiresApproval: boolean }
  | { allowed: false; reason: string };

export function validateDelegation(input: {
  delegationExists: boolean;
  revokedAt?: Date | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  requiresApproval?: boolean;
  canExecute?: boolean;
}): DelegationValidationResult {
  const now = new Date();

  if (!input.delegationExists) {
    return { allowed: false, reason: "DELEGATION_REQUIRED" };
  }

  if (input.revokedAt) {
    return { allowed: false, reason: "DELEGATION_REVOKED" };
  }

  if (input.startsAt && input.startsAt > now) {
    return { allowed: false, reason: "DELEGATION_NOT_ACTIVE_YET" };
  }

  if (input.endsAt && input.endsAt < now) {
    return { allowed: false, reason: "DELEGATION_EXPIRED" };
  }

  if (input.canExecute === false) {
    return { allowed: false, reason: "DELEGATION_CANNOT_EXECUTE" };
  }

  return {
    allowed: true,
    requiresApproval: !!input.requiresApproval,
  };
}
