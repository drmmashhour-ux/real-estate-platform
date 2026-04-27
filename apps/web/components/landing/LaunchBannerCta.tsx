"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { trackEvent } from "@/src/services/analytics";

type Props = {
  href: string;
  remaining: number;
  children: string;
  className?: string;
};

export function LaunchBannerCta({ href, remaining, children, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400",
        className
      )}
      onClick={async () => {
        await trackEvent("launch_banner_clicked", { remaining });
      }}
    >
      {children}
    </Link>
  );
}
