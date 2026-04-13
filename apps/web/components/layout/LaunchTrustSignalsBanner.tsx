"use client";

import { usePathname } from "next/navigation";
import { BadgeCheck, Shield, Sparkles } from "lucide-react";
import { isSelfContainedToolChromePath } from "@/lib/layout/self-contained-tool-paths";
import { isMarketingHomePath } from "@/lib/layout/marketing-home";
import { isInvestmentShellPath } from "@/lib/product-focus";

const SIGNALS = [
  {
    icon: Shield,
    label: "Secure platform — payments powered by Stripe",
  },
  {
    icon: BadgeCheck,
    label: "Verified listings",
  },
  {
    icon: Sparkles,
    label: "New platform — early access",
  },
] as const;

/**
 * Launch-phase reassurance strip — reduces hesitation on cold traffic (ads, SEO, referrals).
 * Hidden where the global marketing header is already omitted (admin, investment shell, tool chrome).
 */
export function LaunchTrustSignalsBanner() {
  const pathname = usePathname();

  if (!pathname) return null;
  if (pathname.startsWith("/admin")) return null;
  if (isMarketingHomePath(pathname)) return null;
  if (isInvestmentShellPath(pathname)) return null;
  if (isSelfContainedToolChromePath(pathname)) return null;

  return (
    <div
      className="border-b border-white/[0.08] bg-[#060606]/90 backdrop-blur-sm"
      role="region"
      aria-label="Trust and platform status"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-2 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-1 sm:py-2">
        {SIGNALS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-2 text-center text-[11px] font-medium leading-snug text-white/80 sm:justify-start sm:text-left sm:text-xs"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400/95" aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
