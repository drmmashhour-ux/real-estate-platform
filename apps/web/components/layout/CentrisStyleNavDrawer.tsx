"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Link as I18nLink } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";

const NAVY = "#0c1a3a";

type AccordionId = "buy" | "rent" | "sell" | "lang" | "region" | null;

function AccordionRow({
  id,
  openId,
  setOpenId,
  label,
  children,
}: {
  id: AccordionId;
  openId: AccordionId;
  setOpenId: (v: AccordionId) => void;
  label: string;
  children: ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="border-b border-black/[0.06]">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        className="lecipm-touch flex min-h-[52px] w-full items-center justify-between px-5 py-3.5 text-left text-base font-medium active:opacity-90"
        style={{ color: NAVY }}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`h-5 w-5 shrink-0 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-black/[0.04] bg-[#f8f9fb] px-3 py-2">{children}</div> : null}
    </div>
  );
}

function SubLink({ href, onClose, children }: { href: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="lecipm-touch flex min-h-[48px] items-center rounded-lg px-3 py-2.5 text-sm font-medium text-[#0c1a3a]/90 hover:bg-white active:opacity-90"
    >
      {children}
    </Link>
  );
}

export function CentrisStyleNavDrawer({
  open,
  onClose,
  loggedIn,
  loginLabel,
  signupLabel,
  dashboardHref,
  compareHref,
  minimalHome = false,
}: {
  open: boolean;
  onClose: () => void;
  loggedIn: boolean;
  loginLabel: string;
  signupLabel: string;
  dashboardHref: string;
  compareHref: string;
  /** Marketing home: Search + Listings only — no hub accordions. */
  minimalHome?: boolean;
}) {
  const [accordion, setAccordion] = useState<AccordionId>(null);

  useEffect(() => {
    if (!open) {
      setAccordion(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  if (minimalHome) {
    return (
      <div
        id="centris-nav-drawer"
        className="fixed inset-0 z-[200] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <button
          type="button"
          className="lecipm-touch absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={onClose}
        />
        <div
          className="absolute left-0 top-0 flex h-full w-[min(20rem,100vw)] max-w-full flex-col overflow-y-auto overscroll-contain rounded-br-3xl bg-white shadow-2xl [-webkit-overflow-scrolling:touch]"
          style={{ boxShadow: "8px 0 40px rgb(0 0 0 / 0.12)" }}
        >
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top,0px))]">
            <button
              type="button"
              onClick={onClose}
              className="lecipm-touch flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full text-[#0c1a3a] transition hover:bg-black/[0.05]"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col px-4 pt-2" aria-label="Primary">
            <I18nLink
              href="/search"
              onClick={onClose}
              className="lecipm-touch flex min-h-[52px] items-center rounded-xl border-b border-black/[0.06] px-3 text-base font-semibold active:opacity-90"
              style={{ color: NAVY }}
            >
              Search
            </I18nLink>
            <I18nLink
              href="/listings"
              onClick={onClose}
              className="lecipm-touch flex min-h-[52px] items-center rounded-xl border-b border-black/[0.06] px-3 text-base font-semibold active:opacity-90"
              style={{ color: NAVY }}
            >
              Listings
            </I18nLink>
          </nav>

          <div className="px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0c1a3a]/50">Language</p>
            <LanguageSwitcher variant="centris" className="w-full [&_label]:w-full [&_select]:w-full" />
          </div>

          <div className="mt-auto border-t border-black/10 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
            {!loggedIn ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#0c1a3a] text-sm font-bold text-[#0c1a3a] hover:bg-[#f8f9fb] active:opacity-90"
                >
                  {loginLabel}
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={onClose}
                  className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-bold text-[#0B0B0B] active:opacity-90"
                  style={{ background: "#d4af37" }}
                >
                  {signupLabel}
                </Link>
              </div>
            ) : (
              <Link
                href="/dashboard"
                onClick={onClose}
                className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-bold text-white active:opacity-90"
                style={{ background: NAVY }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="centris-nav-drawer"
      className="fixed inset-0 z-[200] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
    >
      <button
        type="button"
        className="lecipm-touch absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className="absolute left-0 top-0 flex h-full w-[min(20rem,100vw)] max-w-full flex-col overflow-y-auto overscroll-contain rounded-br-3xl bg-white shadow-2xl [-webkit-overflow-scrolling:touch]"
        style={{ boxShadow: "8px 0 40px rgb(0 0 0 / 0.12)" }}
      >
        <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={onClose}
            className="lecipm-touch flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full text-[#0c1a3a] transition hover:bg-black/[0.05]"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-2 pt-2">
          <Link
            href={PUBLIC_MAP_SEARCH_URL.listingsBuy}
            onClick={onClose}
            className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full border-2 px-4 text-sm font-bold transition hover:bg-[#f8f9fb] active:opacity-90"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            Nearby properties
          </Link>
        </div>

        <nav className="flex-1 pt-2" aria-label="Primary">
          <AccordionRow id="buy" openId={accordion} setOpenId={setAccordion} label="Buy">
            <SubLink href="/explore" onClose={onClose}>
              Explore Québec listings
            </SubLink>
            <SubLink href="/listings" onClose={onClose}>
              All listings
            </SubLink>
            <SubLink href="/buying/by-yourself" onClose={onClose}>
              Buying by yourself
            </SubLink>
            <SubLink href="/buying/with-platform-broker" onClose={onClose}>
              Buying with platform broker
            </SubLink>
          </AccordionRow>

          <AccordionRow id="rent" openId={accordion} setOpenId={setAccordion} label="Rent">
            <SubLink href="/rent" onClose={onClose}>
              Rent Hub
            </SubLink>
            <SubLink href="/rent/packages" onClose={onClose}>
              Rental packages
            </SubLink>
            <SubLink href="/bnhub/stays" onClose={onClose}>
              Short-term stays (BNHUB)
            </SubLink>
          </AccordionRow>

          <AccordionRow id="sell" openId={accordion} setOpenId={setAccordion} label="Sell">
            <SubLink href="/selling" onClose={onClose}>
              Selling options
            </SubLink>
            <SubLink href="/selling/by-yourself" onClose={onClose}>
              Prestige Direct (sell by yourself)
            </SubLink>
            <SubLink href="/selling/with-platform-broker" onClose={onClose}>
              Sell with platform broker
            </SubLink>
            <SubLink href="/selling/with-certified-broker" onClose={onClose}>
              Sell with certified broker
            </SubLink>
            <SubLink href="/dashboard/seller/create" onClose={onClose}>
              Create listing (Seller Hub)
            </SubLink>
          </AccordionRow>

          <Link
            href="/analyze"
            onClick={onClose}
            className="lecipm-touch flex min-h-[52px] items-center border-b border-black/[0.06] px-5 py-3.5 text-base font-medium active:opacity-90"
            style={{ color: NAVY }}
          >
            Analyze
          </Link>
          <Link
            href="/explore"
            onClick={onClose}
            className="lecipm-touch flex min-h-[52px] items-center border-b border-black/[0.06] px-5 py-3.5 text-base font-medium active:opacity-90"
            style={{ color: NAVY }}
          >
            Explore
          </Link>
          <Link
            href={dashboardHref}
            onClick={onClose}
            className="lecipm-touch flex min-h-[52px] items-center border-b border-black/[0.06] px-5 py-3.5 text-base font-medium active:opacity-90"
            style={{ color: NAVY }}
          >
            Dashboard
          </Link>
          <Link
            href={compareHref}
            onClick={onClose}
            className="lecipm-touch flex min-h-[52px] items-center border-b border-black/[0.06] px-5 py-3.5 text-base font-medium active:opacity-90"
            style={{ color: NAVY }}
          >
            Compare
          </Link>

          <Link
            href="/blog"
            onClick={onClose}
            className="lecipm-touch flex min-h-[52px] items-center border-b border-black/[0.06] px-5 py-3.5 text-base font-medium active:opacity-90"
            style={{ color: NAVY }}
          >
            Blog
          </Link>

          <div className="my-3 border-t border-black/10" />

          <AccordionRow id="lang" openId={accordion} setOpenId={setAccordion} label="Language">
            <div className="px-2 py-2">
              <LanguageSwitcher variant="centris" className="w-full [&_label]:w-full [&_select]:w-full" />
            </div>
          </AccordionRow>

          <AccordionRow id="region" openId={accordion} setOpenId={setAccordion} label="Region">
            <SubLink href="/explore" onClose={onClose}>
              Québec — wide search
            </SubLink>
            <SubLink href="/city/montreal" onClose={onClose}>
              Montréal area
            </SubLink>
            <SubLink href="/city/quebec" onClose={onClose}>
              Québec City area
            </SubLink>
          </AccordionRow>
        </nav>

        <div className="mt-auto border-t border-black/10 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
          {!loggedIn ? (
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/login"
                onClick={onClose}
                className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-[#0c1a3a] text-sm font-bold text-[#0c1a3a] hover:bg-[#f8f9fb] active:opacity-90"
              >
                {loginLabel}
              </Link>
              <Link
                href="/auth/signup"
                onClick={onClose}
                className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-bold text-[#0B0B0B] active:opacity-90"
                style={{ background: "#d4af37" }}
              >
                {signupLabel}
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard"
              onClick={onClose}
              className="lecipm-touch flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-bold text-white active:opacity-90"
              style={{ background: NAVY }}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
