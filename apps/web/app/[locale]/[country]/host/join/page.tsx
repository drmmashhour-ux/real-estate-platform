import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { HostJoinClient } from "./host-join-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "List on BNHub — host join | LECIPM",
    description: "List your property in minutes — visibility, AI pricing, and early platform boost.",
    path: "/host/join",
    locale,
    country,
  });
}

export default async function HostJoinPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">BNHub hosts</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">List your property in minutes</h1>
      <p className="mt-3 text-sm text-white/65">
        Verified flows, Stripe-powered bookings, and growth tooling — without leaving money on the table.
      </p>
      <HostJoinClient locale={locale} country={country} />
    </main>
  );
}
