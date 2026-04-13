"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useProductHealth } from "@/components/analytics/ProductHealthProvider";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { shouldHighlightAnalyzeNav, shouldHighlightDashboardNav } from "@/lib/investment/activation-storage";
import { HubNavLinks } from "@/components/hubs/HubNavLinks";
import { MarketplaceHubLinks } from "@/components/marketplace/MarketplaceHubLinks";

const liveLinks = [
  { href: "/", label: "Home" },
  { href: "/analyze#analyzer", label: "Analyze" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
  { href: "/pricing", label: "Pricing" },
] as const;

const demoLinks = [
  { href: "/", label: "Home" },
  { href: "/analyze#analyzer", label: "Start Analysis" },
  { href: "/demo/dashboard", label: "Dashboard" },
  { href: "/demo/compare", label: "Compare" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MvpNav({ variant = "live" }: { variant?: "live" | "demo" }) {
  const pathname = usePathname();
  const { highlightCompare } = useProductHealth();
  const links = variant === "demo" ? demoLinks : liveLinks;
  const [hints, setHints] = useState({ analyze: false, dashboard: false });

  useEffect(() => {
    const refresh = () => {
      setHints({
        analyze: shouldHighlightAnalyzeNav(),
        dashboard: shouldHighlightDashboardNav(),
      });
    };
    refresh();
    window.addEventListener("lecipm-activation-flags-changed", refresh);
    return () => window.removeEventListener("lecipm-activation-flags-changed", refresh);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0B0B]/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-3 sm:gap-4 lg:flex-row lg:flex-wrap lg:px-5"
        aria-label="LECIPM investment"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3">
          <LecipmBrandLockup href="/" variant="dark" align="center" density="compact" priority />
          {variant === "demo" ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
              Demo
            </span>
          ) : null}
        </div>
        {variant === "live" ? (
          <div className="w-full max-w-xl border-y border-white/[0.06] py-2 lg:w-auto lg:max-w-none lg:border-y-0 lg:py-0">
            <HubNavLinks />
          </div>
        ) : null}
        <ul className="hidden flex-wrap items-center justify-center gap-1 lg:flex lg:gap-2">
          {links.slice(0, 2).map(({ href, label }) => {
            const hrefPath = href.split("#")[0] ?? href;
            const active =
              hrefPath === "/"
                ? pathname === "/" || pathname === ""
                : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
            const isAnalyze = href === "/analyze#analyzer";
            const pulseAnalyze = hints.analyze && isAnalyze;
            return (
              <li key={`${variant}-${href}`}>
                <Link
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-premium-gold/12 text-premium-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-premium-gold/45"
                      : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  } ${pulseAnalyze ? "ring-2 ring-premium-gold/50 shadow-[0_0_18px_rgb(var(--premium-gold-channels) / 0.2)]" : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={pulseAnalyze ? "Start with Analyze — run your first deal" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          {variant === "live" ? <MarketplaceHubLinks /> : null}
          {links.slice(2).map(({ href, label }) => {
            const hrefPath = href.split("#")[0] ?? href;
            const active =
              hrefPath === "/"
                ? pathname === "/" || pathname === ""
                : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
            const isCompare = label === "Compare";
            const pulseCompare = highlightCompare && isCompare;
            const isDashboard = label === "Dashboard";
            const pulseDashboard = hints.dashboard && isDashboard;
            const pulseHint = pulseCompare || pulseDashboard;
            return (
              <li key={`${variant}-${href}`}>
                <Link
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-premium-gold/12 text-premium-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-premium-gold/45"
                      : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  } ${pulseCompare ? "ring-2 ring-premium-gold/55 shadow-[0_0_16px_rgb(var(--premium-gold-channels) / 0.22)]" : ""} ${
                    pulseHint ? "ring-2 ring-premium-gold/50 shadow-[0_0_18px_rgb(var(--premium-gold-channels) / 0.2)]" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                  title={
                    pulseCompare
                      ? "Try comparing 2+ saved deals side by side"
                      : pulseDashboard
                        ? "Open your saved deals on the Dashboard"
                        : undefined
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
