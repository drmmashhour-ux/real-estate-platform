"use client";

import { track } from "@/lib/tracking";
import { trackLaunchEvent } from "@/src/modules/launch/LaunchTracker";

export function PrimaryConversionCTA({
  href,
  label,
  event = "conversion_track",
  meta,
  className,
}: {
  href: string;
  label: string;
  event?: string;
  meta?: Record<string, unknown>;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={() => {
        track(event, { meta: { label, ...meta } });
        void trackLaunchEvent("CTA_CLICK", { ...meta, href, label, event });
      }}
      className={className ?? "lecipm-cta-gold-solid px-5 py-2.5 text-sm"}
    >
      {label}
    </a>
  );
}
