"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { appPathnameFromUrl } from "@/i18n/pathname";

const LINKS = [
  { href: "/buying", label: "Buy" },
  { href: "/bnhub/stays", label: "Rent" },
  { href: "/bnhub", label: "BNHub" },
  { href: "/hosts", label: "For Hosts" },
  { href: "/investors", label: "Investors" },
] as const;

function linkCls(active: boolean) {
  return [
    "rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm",
    active ? "bg-premium-gold/12 text-premium-gold" : "text-landing-text/80 hover:text-white",
  ].join(" ");
}

export function LandingNavbar() {
  const pathname = usePathname();
  const appPath = appPathnameFromUrl(pathname ?? "/");
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-[100] border-b transition-colors duration-300",
        solid ? "border-white/10 bg-landing-black/95 shadow-landing-soft backdrop-blur-md" : "border-transparent bg-landing-black/40 backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <LecipmBrandLockup href="/" variant="dark" density="compact" className="max-w-[10rem] shrink-0 sm:max-w-none" />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active =
              l.href === "/bnhub" ? appPath.startsWith("/bnhub") : appPath === l.href || appPath.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href} className={linkCls(active)} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/signup"
            className="hidden min-h-[44px] items-center rounded-full bg-premium-gold px-5 py-2.5 text-sm font-semibold text-premium-bg shadow-landing-glow transition hover:bg-premium-gold-hover sm:inline-flex"
          >
            Start Free
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-landing-text lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-landing-black px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="min-h-[48px] rounded-xl px-3 py-3 text-base font-semibold text-white active:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/signup"
              className="mt-2 flex min-h-[48px] items-center justify-center rounded-full bg-premium-gold py-3 text-center font-semibold text-premium-bg"
              onClick={() => setOpen(false)}
            >
              Start Free
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
