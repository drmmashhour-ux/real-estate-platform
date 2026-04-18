/**
 * Session anomaly hooks — v1 documents patterns; Prisma-backed IP history can be added later.
 * Prefer existing auth/session validation on sensitive routes (`requireUser`, `requireAdminSession`, etc.).
 */
export type SessionGuardHint = {
  rapidIpChangeSuspected: boolean;
  note: string;
};

export function evaluateSessionAnomaly(_opts: {
  currentIp: string;
  lastKnownIp?: string | null;
  userId?: string | null;
}): SessionGuardHint {
  return {
    rapidIpChangeSuspected: false,
    note: "Heuristic placeholder — wire optional IP history + device binding when product requires it.",
  };
}
