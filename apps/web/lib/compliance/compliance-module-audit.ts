import "server-only";

/** Stub audit log — no-op side effects for build viability. */
export async function logComplianceModuleAudit(_opts: {
  actorUserId: string;
  action: string;
  payload?: unknown;
}) {
  // intentionally empty
}
