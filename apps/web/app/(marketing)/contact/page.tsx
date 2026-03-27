import type { Metadata } from "next";
import { ContactFormClient } from "./contact-form-client";
import {
  getPublicContactEmail,
  getPublicContactMailto,
} from "@/lib/marketing-contact";
import {
  getBrokerPhoneDisplay,
  getBrokerTelHref,
  getContactEmail,
  getOfficeAddress,
  getSupportPhoneDisplay,
  getSupportTelHref,
} from "@/lib/config/contact";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_DEFAULT_DESCRIPTION,
  PLATFORM_NAME,
  platformBrandGoldTextClass,
} from "@/lib/brand/platform";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
const supportDisplay = getSupportPhoneDisplay();
const brokerDisplay = getBrokerPhoneDisplay();

export const metadata: Metadata = {
  title: "Contact",
  description: `Reach ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) — support ${supportDisplay}, broker ${brokerDisplay}, email ${getContactEmail()}.`,
  openGraph: {
    title: "Contact",
    description: `General inquiries ${supportDisplay}. Direct broker ${brokerDisplay}. ${PLATFORM_DEFAULT_DESCRIPTION}`,
    ...(siteUrl ? { url: `${siteUrl}/contact` } : {}),
  },
};

const phoneIcon = (
  <svg
    className="h-7 w-7 shrink-0 text-[#C9A646]"
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
);

export default function ContactPage() {
  const email = getPublicContactEmail();
  const mailto = getPublicContactMailto();
  const supportTel = getSupportTelHref();
  const brokerTel = getBrokerTelHref();
  const officeAddress = getOfficeAddress();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PLATFORM_CARREFOUR_NAME,
    telephone: [supportDisplay, brokerDisplay],
    email,
    ...(siteUrl ? { url: siteUrl } : {}),
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${platformBrandGoldTextClass}`}>
            Contact
          </p>
          <p className={`font-serif text-lg font-semibold leading-snug sm:text-xl ${platformBrandGoldTextClass}`}>
            {PLATFORM_NAME}
          </p>
          <p className={`mt-0.5 text-sm font-medium leading-snug ${platformBrandGoldTextClass}`}>
            {PLATFORM_CARREFOUR_NAME}
          </p>
          <p className="mt-1 text-sm text-[#B3B3B3]">Where Prestige Meets Smart Real Estate</p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Talk to a real estate specialist
          </h1>
          <p className="mt-4 max-w-2xl text-[#B3B3B3]">
            Share what you&apos;re looking for — stays, acquisitions, or portfolio strategy — and our team will
            follow up with tailored next steps.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <a
              href={supportTel}
              className="inline-flex items-center gap-3 rounded-2xl border border-[#C9A646]/40 bg-[#121212] px-6 py-4 text-base font-semibold text-white transition hover:border-[#C9A646] hover:text-[#C9A646]"
            >
              {phoneIcon}
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-[#B3B3B3]">
                  General inquiries
                </span>
                {supportDisplay}
              </span>
            </a>
            <a
              href={brokerTel}
              className="inline-flex items-center gap-3 rounded-2xl border border-[#C9A646]/40 bg-[#121212] px-6 py-4 text-base font-semibold text-white transition hover:border-[#C9A646] hover:text-[#C9A646]"
            >
              {phoneIcon}
              <span>
                <span className="block text-xs font-medium uppercase tracking-wide text-[#B3B3B3]">
                  Direct broker
                </span>
                {brokerDisplay}
              </span>
            </a>
          </div>
          <p className="mt-3 text-xs text-[#B3B3B3]/80">Tap a number to open your phone dialer</p>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <ContactFormClient />

            <aside className="space-y-6">
              <div className="rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6 shadow-xl shadow-black/40">
                <h2 className="text-base font-semibold text-[#C9A646]">What to expect</h2>
                <ul className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
                  <li>• A short discovery call to align on your goals.</li>
                  <li>• Curated properties that match your brief.</li>
                  <li>• Clear financials, yield estimates, and risk notes.</li>
                  <li>• Support through negotiation and closing.</li>
                </ul>
                <div className="mt-6 space-y-4 border-t border-white/10 pt-6 text-sm text-[#B3B3B3]">
                  <p>
                    <span className="text-[#C9A646]">Email</span>
                    <br />
                    <a
                      href={mailto}
                      className="font-medium text-white hover:text-[#C9A646]"
                    >
                      {email}
                    </a>
                  </p>
                  <p>
                    <span className="text-[#C9A646]">General inquiries</span>
                    <br />
                    <a
                      href={supportTel}
                      className="inline-flex items-center gap-2 font-medium text-white hover:text-[#C9A646]"
                    >
                      <svg
                        className="h-4 w-4 text-[#C9A646]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                        />
                      </svg>
                      {supportDisplay}
                    </a>
                  </p>
                  <p>
                    <span className="text-[#C9A646]">Direct broker</span>
                    <br />
                    <a
                      href={brokerTel}
                      className="inline-flex items-center gap-2 font-medium text-white hover:text-[#C9A646]"
                    >
                      <svg
                        className="h-4 w-4 text-[#C9A646]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                        />
                      </svg>
                      {brokerDisplay}
                    </a>
                  </p>
                  <p>
                    <span className="text-[#C9A646]">Office</span>
                    <br />
                    {officeAddress}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <iframe
                  title="Laval — office area map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-73.78%2C45.48%2C-73.66%2C45.58&layer=mapnik"
                  className="h-48 w-full bg-[#121212] grayscale contrast-110 sm:h-56"
                  loading="lazy"
                />
                <p className="bg-[#121212] px-3 py-2 text-center text-[10px] text-[#B3B3B3]">
                  Map preview — approximate service region
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
