import type { Metadata } from "next";
import { GrowthLpShell } from "@/components/growth/GrowthLpShell";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "List your stay on BNHub — LECIPM host growth",
  description:
    "Reach guests booking short stays in Québec. Simple setup, Stripe-backed payouts where enabled, and host tools in one place.",
  path: "/lp/host",
});

export default function LpHostPage() {
  return (
    <GrowthLpShell
      variant="host"
      headline="Turn your property into booked nights"
      subhead="BNHub helps you publish, price, and accept reservations with checkout guests trust — while you keep control of your calendar."
      primaryCta={{ label: "Start as a host", href: "/bnhub/host/listings/new" }}
      secondaryCta={{ label: "Host dashboard", href: "/bnhub/host/dashboard" }}
      bullets={[
        "Listing wizard built for stays — photos, amenities, house rules",
        "Guests pay through platform checkout where enabled",
        "Calendar + messaging aligned with BNHub operations",
      ]}
    />
  );
}
