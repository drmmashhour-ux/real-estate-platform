import "server-only";

/** Stub ownership check — allow-through until compliance layer is wired. */
export async function assertComplianceOwnerAccess(
  _user: unknown,
  _ownerType: string,
  _ownerId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  return { ok: true };
}
