import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Home, Landmark } from "lucide-react";
import { ProfessionalsSpotlightStrip } from "@/components/marketing/ProfessionalsSpotlightStrip";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { PLATFORM_NAME } from "@/lib/brand/platform";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Professionals — brokers, finance & sellers | ${seoConfig.siteName}`,
    description: `Find a licensed broker, mortgage tools, or list as a seller on ${PLATFORM_NAME}. Browse public listings and open any property by code.`,
    path: "/professionals",
    locale,
    country,
  });
}

const cards = [
  {
    title: "Real estate broker",
    body: "Licensed resale & rental representation. View a broker profile and their active listings — price, location, summary, and a listing code for the full page.",
    href: "/broker/mohamed-al-mashhour",
    Icon: Building2,
    cta: "View broker profile",
  },
  {
    title: "Mortgage & finance hub",
    body: "Calculators, specialist desk, and buyer finance tools connected to the Immobilier workflow.",
    href: "/financial-hub",
    Icon: Landmark,
    cta: "Open Financial Hub",
  },
  {
    title: "Seller (FSBO)",
    body: "List your own property with platform tools, verification, and optional broker assistance when you want it.",
    href: "/sell",
    Icon: Home,
    cta: "Start selling",
  },
] as const;

export default function ProfessionalsPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#1a1530] to-[#0B0B0B] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Directory</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Who are you working with?</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            Choose a path — broker-led deals, finance tools, or self-serve selling. Broker profiles can show{" "}
            <strong className="text-slate-200">short listing cards</strong> (price, city, summary); open the{" "}
            <strong className="text-slate-200">listing code</strong> for the full property page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map(({ title, body, href, Icon, cta }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#121212] p-6 transition hover:border-premium-gold/40 hover:bg-[#161616]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-premium-gold/30 bg-premium-gold/10">
                <Icon className="h-6 w-6 text-premium-gold" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{body}</p>
              <span className="mt-6 text-sm font-semibold text-premium-gold group-hover:underline">{cta} →</span>
            </Link>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-slate-500">
          Platform broker listings use the same Immobilier Hub inventory as FSBO — filtered by role on the broker profile.
        </p>

        <div className="mx-auto mt-6 max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/90">
            Platform spotlights
          </p>
          <h2 className="mt-2 text-center text-xl font-semibold text-white sm:text-2xl">
            Sellers, hosting, and buyers
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500">
            Highlights across the platform — tap a card to learn more.
          </p>
          <ProfessionalsSpotlightStrip />
        </div>
      </section>
    </main>
  );
}
