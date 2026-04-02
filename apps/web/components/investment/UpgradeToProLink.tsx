"use client";

import * as React from "react";
import Link from "next/link";
import { track, TrackingEvent } from "@/lib/tracking";

type Props = {
  className?: string;
  children?: React.ReactNode;
  /** For analytics */
  source?: string;
};

/**
 * Mock upgrade CTA — links to /pricing (no payment yet).
 */
export function UpgradeToProLink({ className = "", children = "Upgrade to Pro", source = "unknown" }: Props) {
  return (
    <Link
      href={`/pricing?source=${encodeURIComponent(source)}`}
      className={className}
      onClick={() => {
        track(TrackingEvent.INVESTMENT_UPGRADE_CLICK, {
          meta: { source, cta: "upgrade_to_pro" },
        });
      }}
    >
      {children}
    </Link>
  );
}
