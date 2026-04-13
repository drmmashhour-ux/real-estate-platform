"use client";

import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { track, TrackingEvent } from "@/lib/tracking";

type AnchorProps = ComponentPropsWithoutRef<"a">;

const funnelCtaMeta = (listingId: string, cta: string, surface: string) =>
  track(TrackingEvent.CTA_CLICK, {
    meta: { listing_id: listingId, cta, surface },
  });

function trackExperimentCta(
  experiment: { experimentId: string; variantId: string } | undefined,
  metadata: Record<string, unknown> | undefined,
) {
  if (!experiment) return;
  void fetch("/api/experiments/track", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      experimentId: experiment.experimentId,
      variantId: experiment.variantId,
      eventName: "cta_click",
      metadata: metadata ?? {},
    }),
  }).catch(() => {});
}

/**
 * Primary listing CTAs — records `cta_click` for funnel analysis (pair with `booking_started`).
 */
export function FunnelCtaAnchor({
  listingId,
  cta,
  surface = "bnhub_stay",
  experiment,
  onClick,
  ...rest
}: AnchorProps & {
  listingId: string;
  /** Short label for dashboards, e.g. reserve_hero, contact_hero, reserve_sticky */
  cta: string;
  surface?: string;
  experiment?: { experimentId: string; variantId: string };
}) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        funnelCtaMeta(listingId, cta, surface);
        trackExperimentCta(experiment, { cta, surface, listingId });
        onClick?.(e);
      }}
    />
  );
}

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

/** Same as `FunnelCtaAnchor` for Next.js `Link` (prefetch-friendly). */
export function FunnelCtaLink({
  listingId,
  cta,
  surface = "bnhub_stay",
  experiment,
  onClick,
  ...rest
}: LinkProps & {
  listingId: string;
  cta: string;
  surface?: string;
  experiment?: { experimentId: string; variantId: string };
}) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        funnelCtaMeta(listingId, cta, surface);
        trackExperimentCta(experiment, { cta, surface, listingId });
        onClick?.(e);
      }}
    />
  );
}
