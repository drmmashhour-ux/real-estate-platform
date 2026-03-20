"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import {
  getPublicContactEmail,
  getPublicContactMailto,
  getPublicSocialLinks,
} from "@/lib/marketing-contact";
import { getPhoneNumber, getPhoneTelLink, hasPhone } from "@/lib/phone";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function FooterClient() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const phone = getPhoneNumber();
  const tel = getPhoneTelLink();
  const social = getPublicSocialLinks();
  const socialItems = (
    [
      ["linkedin", "LinkedIn", social.linkedin] as const,
      ["instagram", "Instagram", social.instagram] as const,
      ["x", "X", social.x] as const,
    ] as const
  ).filter((entry) => Boolean(entry[2]));

  const linkCls =
    "text-[#B3B3B3] transition-colors duration-200 hover:text-[#D4AF37]";

  return (
    <footer className="border-t border-white/10 bg-[#0B0B0B]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Logo showName className="text-white [&_span]:text-white" />
          <p className="mt-2 max-w-md text-sm text-[#B3B3B3]">
            Mashhour Investments — premium real estate, BNHub stays, and investment access.
          </p>
          {socialItems.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              {socialItems.map(([key, label, href], i) => (
                <span key={key} className="flex items-center gap-3">
                  {i > 0 ? <span className="text-slate-600">·</span> : null}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37] hover:text-[#E8C547]"
                  >
                    {label}
                  </a>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-[#B3B3B3]/80">
              <Link href="/contact" className="font-medium text-[#D4AF37] hover:text-[#E8C547]">
                Contact us
              </Link>{" "}
              for news and social links.
            </p>
          )}
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Company
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/about-platform" className={linkCls}>
                  About us
                </Link>
              </li>
              <li>
                <Link href="/about-platform" className={linkCls}>
                  Mission
                </Link>
              </li>
              <li>
                <Link href="/about-platform" className={linkCls}>
                  Vision
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Services
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/dashboard/real-estate" className={linkCls}>
                  Buy
                </Link>
              </li>
              <li>
                <Link href="/search/bnhub" className={linkCls}>
                  Rent
                </Link>
              </li>
              <li>
                <Link href="/dashboard/investments" className={linkCls}>
                  Invest
                </Link>
              </li>
              <li>
                <Link href="/broker" className={linkCls}>
                  Brokerage
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/contact" className={linkCls}>
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/about-platform" className={linkCls}>
                  Help center
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className={linkCls}>
                  {t("footer_terms")}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className={linkCls}>
                  {t("footer_privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
              <li>
                <span className="text-[#B3B3B3]/80">Email</span>
                <br />
                <a
                  href={getPublicContactMailto()}
                  className="font-medium text-white hover:text-[#D4AF37]"
                >
                  {getPublicContactEmail()}
                </a>
              </li>
              {hasPhone() && (
                <li>
                  <span className="text-[#B3B3B3]/80">Phone</span>
                  <br />
                  <a href={tel} className="font-medium text-white hover:text-[#D4AF37]">
                    {phone} · {t("footer_callUs")}
                  </a>
                </li>
              )}
              <li>
                <span className="text-[#B3B3B3]/80">Location</span>
                <br />
                <span>Montreal &amp; Greater Area, Canada</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#B3B3B3]/90 sm:flex-row sm:items-center">
          <p className="font-medium text-white">
            © {year} Mashhour Investments
          </p>
          <p className="max-w-prose text-[#B3B3B3]">{t("footer_tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
