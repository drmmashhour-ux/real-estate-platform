import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const sections = [
  {
    title: "Autonomous Marketplace",
    text: "LECIPM manages listings, trust, pricing, compliance, and growth from one intelligence layer.",
  },
  {
    title: "AI Pricing Advantage",
    text: "The platform detects demand and adjusts pricing recommendations automatically.",
  },
  {
    title: "OACIQ Compliance Layer",
    text: "Listings can be blocked before publication when required declarations or checks are missing.",
  },
  {
    title: "Revenue Intelligence",
    text: "The platform tracks bookings, fees, payouts, and conversion opportunities.",
  },
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "LECIPM — Investor demo",
    description:
      "A self-optimizing real estate marketplace for listings, short-term rentals, compliance, and revenue.",
  };
}

export default async function InvestorDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold">LECIPM Investor Demo</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A self-optimizing real estate marketplace for listings, short-term rentals, compliance, and revenue.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 text-muted-foreground">{section.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
