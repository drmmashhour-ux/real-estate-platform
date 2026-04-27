import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";

/**
 * Server-side `ab_exposure` for conversion experiments (plugs into `growth_events` + A/B results SQL).
 * Booking flows should add the same `experiment` + `variant` on `booking_completed` metadata when known.
 */
export async function logConversionAbExposure(input: {
  experiment: string;
  variant: string;
  /** Optional listing scope for forensics. */
  listingId?: string | null;
}): Promise<void> {
  const meta: Record<string, unknown> = {
    experiment: input.experiment,
    variant: input.variant,
    path: "/api/ai/conversion",
  };
  if (input.listingId) {
    meta.listingId = input.listingId;
  }
  await recordGrowthEvent({
    eventName: GrowthEventName.AB_EXPOSURE,
    sessionId: null,
    idempotencyKey: `ab_exposure:${input.experiment}:${input.variant}:${input.listingId ?? "na"}`.slice(0, 160),
    metadata: asInputJsonValue(meta),
  }).catch(() => {});
}
