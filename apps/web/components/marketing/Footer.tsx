import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { PLATFORM_COPYRIGHT_LINE } from "@/config/branding";
import { getPublicContactEmail, getPublicContactMailto } from "@/lib/marketing-contact";
import { HUB_LINKS_FOOTER } from "@/lib/marketing/platform-hub-links";
import { TrackedMarketingLink } from "@/components/marketing/TrackedMarketingLink";
import { FooterTrustSignals } from "@/components/layout/FooterTrustSignals";

/** Site footer — shared across marketing surfaces. */
export function Footer() {
  const year = new Date().getFullYear();
  const contactEmail = getPublicContactEmail();
  const mailto = getPublicContactMailto();
  return (
    <footer className="lecipm-footer-glow border-t border-premium-gold/25 bg-black px-4 pt-16 sm:px-6 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
      <div className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:justify-between">
        <div>
          <LecipmBrandLockup href="/" variant="dark" logoClassName="[&_img]:max-h-10" />
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Buy, rent, and invest with AI-backed clarity — one platform for serious real estate.
          </p>
          <p className="mt-3 text-sm text-white/70">
            <a
              href={mailto}
              className="lecipm-touch inline-flex min-h-[48px] items-center font-medium text-[#D4AF37] hover:underline sm:min-h-0"
            >
              {contactEmail}
            </a>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4 [&_a]:lecipm-touch max-sm:[&_li>a]:flex max-sm:[&_li>a]:min-h-[48px] max-sm:[&_li>a]:items-center max-sm:[&_li>a]:rounded-lg max-sm:[&_li>a]:active:bg-white/5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">Hubs</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {HUB_LINKS_FOOTER.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="hover:text-[#D4AF37]">
                    {l.label}
                    {l.hint ? <span className="ml-1 text-[10px] uppercase text-white/40">({l.hint})</span> : null}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/bnhub" className="hover:text-[#D4AF37]">
                  BNHUB →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/search" className="hover:text-[#D4AF37]">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#D4AF37]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/join-broker" className="hover:text-[#D4AF37]">
                  Brokers
                </Link>
              </li>
              <li>
                <Link href="/start-listing" className="hover:text-[#D4AF37]">
                  Sellers
                </Link>
              </li>
              <li>
                <Link href="/professionals" className="hover:text-[#D4AF37]">
                  Professionals
                </Link>
              </li>
              <li>
                <Link href="/financial-hub" className="hover:text-[#D4AF37]">
                  Financial hub
                </Link>
              </li>
              <li>
                <TrackedMarketingLink
                  href="/appraisal-calculator"
                  label="footer_appraisal_calculator"
                  meta={{ page: "footer", placement: "marketing-footer", audience: "seller" }}
                  className="hover:text-[#D4AF37]"
                >
                  Appraisal calculator
                </TrackedMarketingLink>
              </li>
              <li>
                <TrackedMarketingLink
                  href="/mortgage"
                  label="footer_mortgage_experts"
                  meta={{ page: "footer", placement: "marketing-footer", audience: "mortgage" }}
                  className="hover:text-[#D4AF37]"
                >
                  Mortgage experts
                </TrackedMarketingLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/about" className="hover:text-[#D4AF37]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#D4AF37]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-[#D4AF37]">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/90">Archive</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/legacy-home" className="hover:text-[#D4AF37]">
                  Previous homepage
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl space-y-4 text-center sm:text-left">
        <FooterTrustSignals />
        <div className="space-y-1 text-[11px] leading-relaxed text-white/50">
          <p>Designed for Quebec real estate standards.</p>
          <p>Privacy Law 25 compliant.</p>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-[#D4AF37]/20 pt-8 text-center text-xs text-white/45">
        © {year} {PLATFORM_COPYRIGHT_LINE}. All rights reserved.
      </div>
    </footer>
  );
}
