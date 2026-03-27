"use client";

import Link from "next/link";
import { track, TrackingEvent } from "@/lib/tracking";

type Props = {
  href: string;
  className: string;
  children: React.ReactNode;
  /** e.g. home_hero, wix_banner */
  label?: string;
};

/**
 * Primary “Start analyzing” / analyze CTAs — single `<a>`; analytics on click (navigation stays on Link href).
 */
export function TrackedAnalyzeCta({ href, className, children, label = "analyze_cta" }: Props) {
  return (
    <Link
      href={href}
      className={`pointer-events-auto relative z-30 inline-flex max-w-full ${className}`.trim()}
      onClick={() => {
        track(TrackingEvent.INVESTMENT_ANALYZE_CTA_CLICK, {
          meta: { ctaKind: label, href },
        });
      }}
    >
      {children}
    </Link>
  );
}
