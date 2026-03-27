import type { BrokerClientStatus, PlatformRole } from "@prisma/client";

const ORDER: BrokerClientStatus[] = [
  "LEAD",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATING",
  "UNDER_CONTRACT",
  "CLOSED",
];

function idx(s: BrokerClientStatus): number {
  const i = ORDER.indexOf(s);
  return i === -1 ? -1 : i;
}

/**
 * Allowed moves: one step forward/back on the main funnel, jump to LOST from any non-terminal stage,
 * reactivate from LOST to LEAD or CONTACTED. CLOSED is terminal.
 */
export function getAllowedBrokerClientStatusTransitions(
  current: BrokerClientStatus
): BrokerClientStatus[] {
  if (current === "CLOSED") return [];

  if (current === "LOST") {
    return ["LEAD", "CONTACTED"];
  }

  const i = idx(current);
  const out = new Set<BrokerClientStatus>();

  if (i > 0) out.add(ORDER[i - 1]!);
  if (i >= 0 && i < ORDER.length - 1) out.add(ORDER[i + 1]!);
  out.add("LOST");

  return [...out];
}

export function canTransitionBrokerClientStatus(
  current: BrokerClientStatus,
  next: BrokerClientStatus,
  _actorRole: PlatformRole
): boolean {
  void _actorRole;
  if (current === next) return false;
  return getAllowedBrokerClientStatusTransitions(current).includes(next);
}
