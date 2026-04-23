/**
 * Normalize dashboard/API owner keys to match `ComplaintCase.owner_type` (`solo_broker` | `agency`).
 */
export function normalizeHealthOwner(ownerType: string, ownerId: string): { ownerType: string; ownerId: string } {
  const ot = ownerType.trim() === "broker" ? "solo_broker" : ownerType.trim();
  return { ownerType: ot, ownerId: ownerId.trim() };
}
