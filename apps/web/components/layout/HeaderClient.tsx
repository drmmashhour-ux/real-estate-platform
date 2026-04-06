"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { QuebecFlagIcon } from "@/components/brand/QuebecFlagIcon";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { HEADER_CONTROL, HEADER_CONTROL_CTA } from "@/components/layout/header-action-classes";
import { useI18n } from "@/lib/i18n/I18nContext";
import { BuyingNavGroup } from "@/components/layout/BuyingNavGroup";
import { SellingNavGroup } from "@/components/layout/SellingNavGroup";

export default function HeaderClient({
  loggedIn,
  roleCookie: _roleCookie,
}: {
  loggedIn: boolean;
  roleCookie: string | null;
}) {
  void _roleCookie;
  const { t } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solidNav, setSolidNav] = useState(false);

  const normalizedPath = useMemo(
    () => (pathname ? pathname.replace(/\/$/, "") || "/" : "/"),
    [pathname]
  );

  const dashboardHref = loggedIn ? "/dashboard" : "/demo/dashboard";
  const compareHref = loggedIn ? "/compare" : "/demo/compare";

  const analyzeActive = normalizedPath.startsWith("/analyze");
  const dashboardActive =
    normalizedPath === "/dashboard" || normalizedPath.startsWith("/demo/dashboard");
  const compareActive = normalizedPath.startsWith("/compare");

  useEffect(() => {
    const onScroll = () => setSolidNav(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const headerShell = solidNav
    ? "border-b border-white/10 bg-[#0B0B0B]/95 shadow-sm shadow-black/25 backdrop-blur-md"
    : "border-b border-transparent bg-transparent";

  const phoneDisplay = getPhoneNumber();
  const phoneTel = getPhoneTelLink();

  const navLink = (active: boolean) =>
    [
      "relative text-sm font-semibold transition duration-200",
      active ? "text-premium-gold" : "text-[#B3B3B3] hover:text-white",
    ].join(" ");

  const NavUnderline = ({ active }: { active: boolean }) =>
    active ? (
      <span
        className="absolute -bottom-2 left-0 right-0 mx-auto h-0.5 max-w-[2.25rem] rounded-full bg-premium-gold"
        aria-hidden
      />
    ) : null;

  const actionRow = (
    <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
      {phoneTel ? (
        <a
          href={phoneTel}
          className={`${HEADER_CONTROL} max-w-[11rem]`}
          aria-label={`Call ${phoneDisplay}`}
        >
          <svg
            className="h-4 w-4 shrink-0 opacity-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="truncate whitespace-nowrap">{phoneDisplay}</span>
        </a>
      ) : null}
      <LanguageSwitcher variant="header" className="items-center" />
      {!loggedIn ? (
        <>
          <Link href="/auth/login" className={HEADER_CONTROL}>
            {t("auth.login")}
          </Link>
          <Link href="/auth/signup" className={HEADER_CONTROL_CTA}>
            {t("auth.signup")}
          </Link>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className={`${HEADER_CONTROL} lg:hidden`}
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
      >
        <span className="sr-only">{t("common.a11y.toggleMenu")}</span>
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>
    </div>
  );

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${headerShell}`}>
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <QuebecFlagIcon className="h-4 w-6 shrink-0 rounded-sm sm:h-5 sm:w-7" aria-hidden />
            <Logo variant="nav" showName className="min-w-0" />
            <span className="hidden rounded-full border border-premium-gold/35 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold xl:inline">
              Quebec Platform
            </span>
          </div>

          <div className="hidden items-center justify-center gap-8 lg:flex" aria-hidden={false}>
            <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Primary navigation">
              <Link
                href="/analyze"
                aria-current={analyzeActive ? "page" : undefined}
                className={navLink(analyzeActive)}
              >
                Analyze
                <NavUnderline active={analyzeActive} />
              </Link>
              <BuyingNavGroup mode="header-desktop" />
              <SellingNavGroup mode="header-desktop" />
              <Link
                href={dashboardHref}
                aria-current={dashboardActive ? "page" : undefined}
                className={navLink(dashboardActive)}
              >
                Dashboard
                <NavUnderline active={dashboardActive} />
              </Link>
              <Link
                href={compareHref}
                aria-current={compareActive ? "page" : undefined}
                className={navLink(compareActive)}
              >
                Compare
                <NavUnderline active={compareActive} />
              </Link>
            </nav>
          </div>

          {actionRow}
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="border-t border-white/10 bg-[#0B0B0B]/98 backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <nav className="flex flex-col gap-1" aria-label="Primary navigation">
              <Link
                href="/analyze"
                onClick={() => setMobileOpen(false)}
                className={[
                  "rounded-lg px-3 py-3 text-sm font-semibold transition",
                  analyzeActive
                    ? "bg-premium-gold/15 text-premium-gold"
                    : "text-[#B3B3B3] hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                Analyze
              </Link>
              <BuyingNavGroup mode="header-mobile" onNavigate={() => setMobileOpen(false)} />
              <SellingNavGroup mode="header-mobile" onNavigate={() => setMobileOpen(false)} />
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className={[
                  "rounded-lg px-3 py-3 text-sm font-semibold transition",
                  dashboardActive
                    ? "bg-premium-gold/15 text-premium-gold"
                    : "text-[#B3B3B3] hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                Dashboard
              </Link>
              <Link
                href={compareHref}
                onClick={() => setMobileOpen(false)}
                className={[
                  "rounded-lg px-3 py-3 text-sm font-semibold transition",
                  compareActive
                    ? "bg-premium-gold/15 text-premium-gold"
                    : "text-[#B3B3B3] hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                Compare
              </Link>
            </nav>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-3 flex flex-col gap-3 sm:hidden">
                {phoneTel ? (
                  <a href={phoneTel} className={`${HEADER_CONTROL} w-full justify-center`}>
                    {phoneDisplay}
                  </a>
                ) : null}
                <LanguageSwitcher variant="header" className="[&_label]:block [&_label]:w-full [&_select]:w-full" />
              </div>
              {!loggedIn ? (
                <div className="flex flex-col gap-4 lg:hidden">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className={`${HEADER_CONTROL} w-full`}
                  >
                    {t("auth.login")}
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className={`${HEADER_CONTROL_CTA} w-full`}
                  >
                    {t("auth.signup")}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
