"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QuebecCanadaFlagsPair } from "@/components/brand/QuebecCanadaFlagsPair";
import {
  getPublicContactEmail,
  getPublicContactMailto,
  getPublicSocialLinks,
} from "@/lib/marketing-contact";
import {
  getBrokerPhoneDisplay,
  getBrokerTelHref,
  getOfficeAddress,
  getSupportPhoneDisplay,
  getSupportTelHref,
} from "@/lib/config/contact";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_COPYRIGHT_LINE,
  PLATFORM_NAME,
  platformBrandGoldTextClass,
} from "@/lib/brand/platform";
const BRAND_SLOGAN = "Where Prestige Meets Smart Real Estate";
const PRIMARY_PHONE_DISPLAY = "+1 844 441 5444";
const PRIMARY_PHONE_HREF = "tel:+18444415444";

export default function FooterClient() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();
  const year = new Date().getFullYear();

  if (pathname.startsWith("/admin")) {
    return null;
  }
  const supportPhone = getSupportPhoneDisplay();
  const supportTel = getSupportTelHref();
  const brokerPhone = getBrokerPhoneDisplay();
  const brokerTel = getBrokerTelHref();
  const officeAddress = getOfficeAddress();
  const social = getPublicSocialLinks();
  const socialItems = (
    [
      ["linkedin", "LinkedIn", social.linkedin] as const,
      ["instagram", "Instagram", social.instagram] as const,
      ["x", "X", social.x] as const,
    ] as const
  ).filter((entry) => Boolean(entry[2]));

  const linkCls =
    "text-[#B3B3B3] transition-colors duration-200 hover:text-premium-gold";

  return (
    <footer className="border-t border-white/10 bg-[#0B0B0B]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <nav
          aria-label="Launch links"
          className="mb-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-b border-white/10 pb-8 text-sm font-medium sm:justify-start"
        >
          <Link href="/about-platform" className="text-white transition hover:text-premium-gold">
            About
          </Link>
          <Link href="/#faq-lecipm" className="text-white transition hover:text-premium-gold">
            FAQ
          </Link>
          <Link href="/contact" className="text-white transition hover:text-premium-gold">
            Contact
          </Link>
          <Link href="/list-your-property" className="text-white transition hover:text-premium-gold">
            List your property
          </Link>
          <Link href="/host/listings/new" className="text-white transition hover:text-premium-gold">
            Start a listing (host)
          </Link>
          <Link href="/broker/dashboard" className="text-white transition hover:text-premium-gold">
            Broker workspace
          </Link>
        </nav>
        <div className="mb-10">
          <Link href="/" className="group inline-block max-w-full">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-x-3 sm:gap-y-1 sm:text-left">
              <div className="flex flex-col items-center gap-0.5 sm:items-start">
                <p className={`font-serif text-xl font-semibold leading-snug sm:text-2xl ${platformBrandGoldTextClass}`}>
                  {PLATFORM_NAME}
                </p>
                <p className={`max-w-md text-sm font-medium leading-snug ${platformBrandGoldTextClass}`}>
                  {PLATFORM_CARREFOUR_NAME}
                </p>
              </div>
              <span className="hidden h-4 w-px shrink-0 bg-premium-gold/40 sm:block" aria-hidden />
              <p className={`text-sm font-medium ${platformBrandGoldTextClass}`}>{BRAND_SLOGAN}</p>
              <span className="hidden h-4 w-px shrink-0 bg-premium-gold/40 sm:block" aria-hidden />
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:justify-start">
                <QuebecCanadaFlagsPair gapClass="gap-2" />
                <span className="text-xs font-medium text-sky-400">Québec-based platform</span>
              </div>
            </div>
          </Link>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[#B3B3B3] sm:mx-0 sm:text-left">
            Real estate investment intelligence — analysis, portfolio, and comparison tools built for clarity.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-[#9CA3AF] sm:mx-0 sm:text-left">
            <strong className="text-white">Need help?</strong>{" "}
            <a
              href={getPublicContactMailto()}
              className="font-medium text-premium-gold hover:underline"
            >
              Contact us
            </a>{" "}
            ·{" "}
            <Link href="/contact" className="text-[#B3B3B3] hover:text-premium-gold hover:underline">
              Contact form
            </Link>
          </p>
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-premium-gold/25 bg-[#121212]/70 px-4 py-3 sm:mx-0">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-premium-gold/12 text-premium-gold">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </span>
              <p className="text-sm leading-relaxed text-[#B3B3B3]">
                <strong className="text-white">Trusted real estate platform.</strong> LECIPM delivers structured analysis and
                secure flows for confident decisions.{" "}
                <Link href="/about-platform" className="font-medium text-premium-gold hover:underline">
                  About LECIPM
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {socialItems.length > 0
              ? socialItems.map(([key, label, href], i) => (
                  <span key={key} className="flex items-center gap-2">
                    {i > 0 ? <span className="text-slate-600">·</span> : null}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold uppercase tracking-wide text-premium-gold hover:text-premium-gold"
                    >
                      {label}
                    </a>
                  </span>
                ))
              : null}
            <span className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-wide text-[#B3B3B3]/80 sm:justify-start">
              <span className="rounded-full border border-white/10 px-2.5 py-1">LinkedIn</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1">Instagram</span>
              <span className="rounded-full border border-white/10 px-2.5 py-1">X</span>
            </span>
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Platform, trust & legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
              Platform
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/about-platform" className={linkCls}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className={linkCls}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#faq-lecipm" className={linkCls}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkCls}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className={linkCls}>
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className={linkCls}>
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Core product (investment hub) — other hubs remain on direct URLs */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
              Investment
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/analyze" className={linkCls}>
                  Analyze
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className={linkCls}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/compare" className={linkCls}>
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className={linkCls}>
                  How it works
                </Link>
              </li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
              Cities
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/city/montreal" className={linkCls}>
                  Montreal
                </Link>
              </li>
              <li>
                <Link href="/city/laval" className={linkCls}>
                  Laval
                </Link>
              </li>
              <li>
                <Link href="/city/quebec" className={linkCls}>
                  Quebec
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
              Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/contact" className={linkCls}>
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/help" className={linkCls}>
                  Help center
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className={linkCls}>
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className={linkCls}>
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/legal" className={linkCls}>
                  {t("footer.legalCenter")}
                </Link>
              </li>
              <li>
                <Link href="/legal/copyright" className={linkCls}>
                  {t("footer.copyrightPage")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
              <li>
                <span className="text-[#B3B3B3]/80">Phone</span>
                <br />
                <a href={PRIMARY_PHONE_HREF} className="font-medium text-white hover:text-premium-gold">
                  {PRIMARY_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <span className="text-[#B3B3B3]/80">Email</span>
                <br />
                <a
                  href={getPublicContactMailto()}
                  className="font-medium text-white hover:text-premium-gold"
                >
                  {getPublicContactEmail()}
                </a>
              </li>
              <li>
                <span className="text-[#B3B3B3]/80">Support</span>
                <br />
                <a href={supportTel} className="font-medium text-white hover:text-premium-gold">
                  {supportPhone}
                  <span className="text-[#B3B3B3]/90"> · {t("footer.callUs")}</span>
                </a>
              </li>
              <li>
                <span className="text-[#B3B3B3]/80">Broker</span>
                <br />
                <a href={brokerTel} className="font-medium text-white hover:text-premium-gold">
                  {brokerPhone}
                </a>
              </li>
              <li>
                <span className="text-[#B3B3B3]/80">Location</span>
                <br />
                <span>{officeAddress}</span>
                <span className="mt-1 block text-xs text-[#B3B3B3]/80">Greater Montreal &amp; province-wide services</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-[#B3B3B3]/90 sm:text-left">
          <p className="font-medium text-white">
            © {year} {PLATFORM_COPYRIGHT_LINE}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
