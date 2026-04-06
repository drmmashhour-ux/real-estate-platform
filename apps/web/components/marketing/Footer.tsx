import Link from "next/link";
import {
  PLATFORM_COPYRIGHT_LINE,
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_NAME,
} from "@/config/branding";
import { getPublicContactEmail, getPublicContactMailto } from "@/lib/marketing-contact";
import { HUB_LINKS_FOOTER } from "@/lib/marketing/platform-hub-links";
import { TrackedMarketingLink } from "@/components/marketing/TrackedMarketingLink";

/** Site footer — shared across marketing surfaces. */
export function Footer() {
  const year = new Date().getFullYear();
  const contactEmail = getPublicContactEmail();
  const mailto = getPublicContactMailto();
  return (
    <footer className="border-t border-[#D4AF37]/25 bg-black px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <p className="font-serif text-xl font-semibold text-white">{PLATFORM_NAME}</p>
          <p className="mt-1 text-sm text-[#D4AF37]">{PLATFORM_CARREFOUR_NAME}</p>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Buy, rent, and invest with AI-backed clarity — one platform for serious real estate.
          </p>
          <p className="mt-3 text-sm text-white/70">
            <a href={mailto} className="font-medium text-[#D4AF37] hover:underline">
              {contactEmail}
            </a>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
                  BNHub →
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
                <Link href="/demo" className="hover:text-[#D4AF37]">
                  Demo
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
      <div className="mx-auto mt-12 max-w-6xl border-t border-[#D4AF37]/20 pt-8 text-center text-xs text-white/45">
        © {year} {PLATFORM_COPYRIGHT_LINE}. All rights reserved.
      </div>
    </footer>
  );
}
