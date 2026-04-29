import "server-only";

/**
 * Narrow barrel for `@/lib/ai` default export surface (evaluate / fraud primitives).
 */

export async function evaluate(input: {
  entityType: "listing" | "booking" | "user";
  entityId: string;
  log?: boolean;
}): Promise<{
  riskScore: number;
  trustLevel: string;
  factors: unknown[];
  entityType: string;
  entityId: string;
}> {
  void input.log;
  return {
    riskScore: 0,
    trustLevel: "medium",
    factors: [],
    entityType: input.entityType,
    entityId: input.entityId,
  };
}

export async function fraudCheckListing(
  _listingId: string,
  _opts?: { store?: boolean; log?: boolean },
): Promise<{
  riskScore: number;
  trustLevel: string;
  recommendedAction: string;
  factors: unknown[];
  alertsTriggered: number;
}> {
  return {
    riskScore: 0,
    trustLevel: "medium",
    recommendedAction: "review",
    factors: [],
    alertsTriggered: 0,
  };
}

export async function fraudCheckEntity(
  _entityType: string,
  _entityId: string,
  _opts?: { store?: boolean; log?: boolean },
): Promise<{
  riskScore: number;
  trustLevel: string;
  recommendedAction: string;
  factors: unknown[];
  alertsTriggered: number;
}> {
  return {
    riskScore: 0,
    trustLevel: "medium",
    recommendedAction: "review",
    factors: [],
    alertsTriggered: 0,
  };
}
