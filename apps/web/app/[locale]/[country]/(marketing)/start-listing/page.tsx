import type { Metadata } from "next";
import Link from "next/link";
import { TrackedMarketingLink } from "@/components/marketing/TrackedMarketingLink";

export const metadata: Metadata = {
  title: "Start your listing",
  description:
    "Start your property listing with stronger visibility, guided setup, and premium seller support on LECIPM.",
};

const sellerBenefits = [
  "Guided setup so you can launch with more clarity and fewer mistakes",
  "Stronger buyer-facing presentation that helps your property feel more premium",
  "Printable brochure and seller packet exports for cleaner sharing",
  "Optional broker support when you want help, not confusion",
  "Upgrade path into visibility, legal-readiness, and premium seller assistance",
  "A trust-focused listing flow designed for real estate conversion, not just posting",
];

const packages = [
  {
    name: "Sell Hub Basic",
    price: "Entry / low cost",
    blurb: "Get your property online quickly with guided setup and basic visibility.",
  },
  {
    name: "Sell Hub Premium",
    price: "Core upgrade",
    blurb: "Improve visibility, listing quality, and presentation with stronger buyer-facing polish.",
    highlight: true,
  },
  {
    name: "Sell Hub Legal Plus",
    price: "High-value support",
    blurb: "Add legal-readiness guidance, document support, and stronger pre-publish confidence.",
  },
] as const;

export default function StartListingPage() {
  return (
    <div className="bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#1f2b52,transparent_34%),linear-gradient(180deg,#0b0b0b,#111827)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-premium-gold">Seller Launch</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Start your listing with more clarity and support.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Create a stronger listing, present your property professionally, and choose the selling path that fits you best:
              direct, guided, or broker-supported.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedMarketingLink
                href="/sell/create"
                label="start_listing_hero_primary"
                meta={{ page: "start-listing", placement: "hero", audience: "seller" }}
                className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Start your listing
              </TrackedMarketingLink>
              <TrackedMarketingLink
                href="/pricing/seller"
                label="start_listing_hero_secondary"
                meta={{ page: "start-listing", placement: "hero", audience: "seller" }}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
              >
                Explore seller packages
              </TrackedMarketingLink>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {sellerBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-premium-gold/20 bg-black/30 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-premium-gold/90">Why sellers use it</p>
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Present better from day one</p>
                <p className="mt-2 text-sm text-slate-400">
                  Your property should feel organized, trustworthy, and serious before buyers start evaluating it.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Choose your support level</p>
                <p className="mt-2 text-sm text-slate-400">
                  Start independently, then upgrade into premium support or broker collaboration whenever you need it.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Use the platform as your seller command center</p>
                <p className="mt-2 text-sm text-slate-400">
                  Keep documents, visibility, inquiries, print exports, and next steps inside one cleaner experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Packages</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Choose the selling path that matches your goal</h2>
            <p className="mt-4 text-base text-slate-400">
              Start simple, then move into stronger visibility, legal confidence, and premium support when you need it.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-3xl border p-6 ${
                  ("highlight" in pkg && pkg.highlight)
                    ? "border-premium-gold/40 bg-premium-gold/10 shadow-[0_0_32px_rgb(var(--premium-gold-channels)/0.16)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className="text-lg font-semibold text-white">{pkg.name}</p>
                <p className="mt-3 text-2xl font-semibold text-premium-gold">{pkg.price}</p>
                <p className="mt-3 text-sm text-slate-400">{pkg.blurb}</p>
                <div className="mt-8 flex gap-3">
                  <TrackedMarketingLink
                    href="/sell/create"
                    label={`start_listing_package_${pkg.name.toLowerCase().replace(/\s+/g, "_")}_primary`}
                    meta={{ page: "start-listing", placement: "packages", package: pkg.name }}
                    className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Start now
                  </TrackedMarketingLink>
                  <TrackedMarketingLink
                    href="/pricing/seller"
                    label={`start_listing_package_${pkg.name.toLowerCase().replace(/\s+/g, "_")}_secondary`}
                    meta={{ page: "start-listing", placement: "packages", package: pkg.name }}
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
                  >
                    See details
                  </TrackedMarketingLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Call to action</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start with a stronger listing.</h2>
            <p className="mt-3 text-slate-400">
              Create a property experience that feels more trusted, better organized, and ready for serious buyer attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <TrackedMarketingLink
              href="/sell/create"
              label="start_listing_footer_primary"
              meta={{ page: "start-listing", placement: "footer", audience: "seller" }}
              className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Create listing
            </TrackedMarketingLink>
            <TrackedMarketingLink
              href="/sell"
              label="start_listing_footer_secondary"
              meta={{ page: "start-listing", placement: "footer", audience: "seller" }}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              View seller page
            </TrackedMarketingLink>
          </div>
        </div>
      </section>
    </div>
  );
}
