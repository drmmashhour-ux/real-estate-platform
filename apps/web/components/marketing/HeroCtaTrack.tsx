"use client";

import { Link } from "@/i18n/navigation";
import { trackMarketingEvent } from "@/lib/analytics";
import { recordFunnelEvent } from "@/modules/conversion/funnel-metrics.service";

export function HeroCtaTrack({
  href,
  label,
  event,
  variant,
  meta,
}: {
  href: string;
  label: string;
  event: string;
  variant: "primary" | "secondary";
  meta?: Record<string, unknown>;
}) {
  const base =
    variant === "primary"
      ? "inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-premium-gold px-6 py-3 text-center text-sm font-semibold text-premium-bg shadow-landing-glow transition hover:bg-premium-gold-hover sm:w-auto"
      : "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-premium-gold/50 hover:bg-white/10 sm:w-auto";

  return (
    <Link
      href={href}
      className={base}
      onClick={() => {
        recordFunnelEvent("homepage", "CTA_click");
        trackMarketingEvent(event, { surface: "hero", ...meta });
      }}
    >
      {label}
    </Link>
  );
}
