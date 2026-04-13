"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { QuebecFlagIcon } from "@/components/brand/QuebecFlagIcon";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { CountrySelector } from "@/components/i18n/CountrySelector";
import { appPathnameFromUrl } from "@/i18n/pathname";
import { HEADER_CONTROL, HEADER_CONTROL_CTA } from "@/components/layout/header-action-classes";
import { useI18n } from "@/lib/i18n/I18nContext";
import { BuyingNavGroup } from "@/components/layout/BuyingNavGroup";
import { CentrisStyleNavDrawer } from "@/components/layout/CentrisStyleNavDrawer";
import { SellingNavGroup } from "@/components/layout/SellingNavGroup";
import { isMarketingHomePath } from "@/lib/layout/marketing-home";

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

  const appPath = useMemo(() => appPathnameFromUrl(pathname ?? "/"), [pathname]);
  const clutterFreeHome = isMarketingHomePath(pathname);

  const dashboardHref = loggedIn ? "/dashboard" : "/demo/dashboard";
  const compareHref = loggedIn ? "/compare" : "/demo/compare";

  const searchActive = appPath.startsWith("/search");
  const listingsHubActive = appPath.startsWith("/listings");
  const analyzeActive = appPath.startsWith("/analyze");
  const exploreActive = appPath.startsWith("/explore");
  const dashboardActive = appPath === "/dashboard" || appPath.startsWith("/demo/dashboard");
  const compareActive = appPath.startsWith("/compare");

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
    <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
      {phoneTel && !clutterFreeHome ? (
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
      <CountrySelector variant="header" className="items-center" />
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
        aria-controls="centris-nav-drawer"
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
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${clutterFreeHome ? "py-2 sm:py-2.5" : "py-3.5"}`}
      >
        <div className={`flex flex-col ${clutterFreeHome ? "gap-2" : "gap-3"}`}>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <QuebecFlagIcon className="h-4 w-6 shrink-0 rounded-sm sm:h-5 sm:w-7" aria-hidden />
            <LecipmBrandLockup href="/" variant="dark" align="center" density="compact" priority />
            {!clutterFreeHome ? (
              <span className="hidden rounded-full border border-premium-gold/35 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold xl:inline">
                Quebec Platform
              </span>
            ) : null}
          </div>

          <div className="hidden items-center justify-center gap-8 lg:flex" aria-hidden={false}>
            {clutterFreeHome ? (
              <nav className="flex flex-wrap items-center justify-center gap-10" aria-label="Primary navigation">
                <Link
                  href="/search"
                  aria-current={searchActive ? "page" : undefined}
                  className={navLink(searchActive)}
                >
                  Search
                  <NavUnderline active={searchActive} />
                </Link>
                <Link
                  href="/listings"
                  aria-current={listingsHubActive ? "page" : undefined}
                  className={navLink(listingsHubActive)}
                >
                  Listings
                  <NavUnderline active={listingsHubActive} />
                </Link>
              </nav>
            ) : (
              <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Primary navigation">
                <Link
                  href="/analyze"
                  aria-current={analyzeActive ? "page" : undefined}
                  className={navLink(analyzeActive)}
                >
                  Analyze
                  <NavUnderline active={analyzeActive} />
                </Link>
                <Link
                  href="/explore"
                  aria-current={exploreActive ? "page" : undefined}
                  className={navLink(exploreActive)}
                >
                  Explore
                  <NavUnderline active={exploreActive} />
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
            )}
          </div>

          {actionRow}
        </div>
      </div>

      <CentrisStyleNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        loggedIn={loggedIn}
        loginLabel={t("auth.login")}
        signupLabel={t("auth.signup")}
        dashboardHref={dashboardHref}
        compareHref={compareHref}
        minimalHome={clutterFreeHome}
      />
    </header>
  );
}
