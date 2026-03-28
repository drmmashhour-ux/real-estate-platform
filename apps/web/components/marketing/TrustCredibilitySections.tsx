import Link from "next/link";
import { getOfficeAddress } from "@/lib/config/contact";
import { getPublicContactEmail, getPublicContactMailto } from "@/lib/marketing-contact";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconUserBadge({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

/**
 * Trust, professional identity, disclaimer, and contact — for homepage / marketing.
 */
export function TrustCredibilitySections() {
  const email = getPublicContactEmail();
  const mailto = getPublicContactMailto();
  const phoneDisplay = getPhoneNumber();
  const phoneTel = getPhoneTelLink();
  const officeAddress = getOfficeAddress();

  return (
    <section className="border-t border-white/10 bg-[#0B0B0B] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Trusted platform */}
        <div className="rounded-3xl border border-premium-gold/25 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-premium-gold/12 text-premium-gold">
              <IconShield className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Trusted Real Estate Platform</h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
                LECIPM is built to provide reliable, data-driven insights for real estate investment decisions. Our platform
                combines market knowledge, structured analysis, and secure systems to help users make confident decisions.
              </p>
              <ul className="mt-6 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-xs font-medium text-[#9CA3AF] sm:gap-4 sm:text-sm">
                <li className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <span className="text-premium-gold" aria-hidden>
                    ✓
                  </span>
                  Structured analysis
                </li>
                <li className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <span className="text-premium-gold" aria-hidden>
                    ✓
                  </span>
                  Secure, modern stack
                </li>
                <li className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <span className="text-premium-gold" aria-hidden>
                    ✓
                  </span>
                  Transparent methodology
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Professional identity */}
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-premium-gold/10 text-premium-gold">
                <IconUserBadge className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Professional identity</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
                  Founded by <strong className="text-white">Mohamed Al Mashhour</strong>, licensed real estate broker based
                  in Laval, Quebec.
                </p>
              </div>
            </div>
          </div>

          {/* Contact & presence */}
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-white">Contact &amp; presence</h3>
            <ul className="mt-5 space-y-4 text-sm text-[#B3B3B3]">
              <li className="flex gap-3">
                <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-premium-gold" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">Location</p>
                  <p className="mt-0.5 text-white">{officeAddress}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <IconMail className="mt-0.5 h-5 w-5 shrink-0 text-premium-gold" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">Email</p>
                  <a href={mailto} className="mt-0.5 font-medium text-white hover:text-premium-gold">
                    {email}
                  </a>
                </div>
              </li>
              {phoneTel ? (
                <li className="flex gap-3">
                  <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-premium-gold" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">Phone</p>
                    <a href={phoneTel} className="mt-0.5 font-medium text-white hover:text-premium-gold">
                      {phoneDisplay}
                    </a>
                  </div>
                </li>
              ) : (
                <li className="flex gap-3">
                  <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-premium-gold" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">Phone</p>
                    <p className="mt-0.5 text-[#737373]">Configure in deployment (see contact settings).</p>
                  </div>
                </li>
              )}
            </ul>
            <p className="mt-6 text-xs text-[#737373]">
              Prefer a form?{" "}
              <Link href="/contact" className="font-medium text-premium-gold hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </div>

        {/* Data disclaimer */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <IconDocument className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-200/95">Data disclaimer</h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-100/90 sm:text-base">
                All analyses provided by the platform are for informational purposes only and should not be considered
                financial advice. Users should conduct their own due diligence before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
