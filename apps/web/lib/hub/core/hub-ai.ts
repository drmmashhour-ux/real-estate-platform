/**
 * AI / autopilot integration points — config-driven; execution stays in existing modules.
 */

import type { HubAiCapabilities } from "./hub-types";

export type HubAiRecommendationKind = "pricing" | "conversion" | "messaging" | "ops" | "fraud";

export type HubAiRecommendationInput = {
  hubKey: string;
  kind: HubAiRecommendationKind;
  entityType?: string;
  entityId?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export type HubOperationalSummaryInput = {
  hubKey: string;
  hostUserId?: string;
  listingId?: string;
  window?: Record<string, string>;
};

export function hubSupportsAiCapability(cap: HubAiCapabilities, key: keyof HubAiCapabilities): boolean {
  return cap[key] === true;
}

/** Normalizes payload for downstream AI services (Posthog, operator, etc.). */
export function createHubAiRecommendationPayload(input: HubAiRecommendationInput): HubAiRecommendationInput {
  return {
    hubKey: input.hubKey,
    kind: input.kind,
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    metadata: { ...(input.metadata ?? {}) },
  };
}

export function createHubOperationalSummaryRequest(input: HubOperationalSummaryInput): HubOperationalSummaryInput {
  return { ...input };
}
