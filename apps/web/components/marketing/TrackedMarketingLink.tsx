"use client";

import Link from "next/link";
import * as React from "react";
import { track } from "@/lib/tracking";
import { trackLaunchEvent } from "@/src/modules/launch/LaunchTracker";

type Props = {
  href: string;
  label: string;
  event?: string;
  meta?: Record<string, unknown>;
  className?: string;
  children: React.ReactNode;
};

export function TrackedMarketingLink({
  href,
  label,
  event = "conversion_track",
  meta,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        track(event, { meta: { label, href, ...meta } });
        void trackLaunchEvent("CTA_CLICK", { label, href, event, ...meta });
      }}
    >
      {children}
    </Link>
  );
}
