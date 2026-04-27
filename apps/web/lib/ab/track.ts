import { track, TrackingEvent } from "@/lib/tracking";

/**
 * Client beacon: one row in `growth_events` with `event_name` = `ab_exposure` and
 * `metadata` containing `experiment` + `variant` (and optional dedupe key).
 */
export function trackAbExposure(
  experiment: string,
  variant: string,
  options?: { dedupeKey?: string; path?: string }
): void {
  if (typeof window === "undefined") return;
  const path = options?.path ?? `${window.location.pathname}${window.location.search}`;
  track(TrackingEvent.AB_EXPOSURE, {
    path,
    meta: {
      experiment,
      variant,
      ...(options?.dedupeKey
        ? { growthDedupeKey: options.dedupeKey.slice(0, 160) }
        : {}),
    },
  });
}

/**
 * Funnel events that already go through `track` / `booking_completed` — merge A/B into `meta` so
 * the results query can join exposures to conversions by experiment + variant.
 * (Server-written `booking_completed` should merge the same keys in `metadata` where applicable.)
 */
export function withAbMeta(
  base: Record<string, unknown> | undefined,
  experiment: string,
  variant: string
): Record<string, unknown> {
  return { ...base, experiment, variant };
}
