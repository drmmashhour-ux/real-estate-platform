import type { Metadata } from "next";
import { GrowthLpShell } from "@/components/growth/GrowthLpShell";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Book a stay — LECIPM BNHub",
  description: "Discover short stays in Québec. Secure BNHub checkout with Stripe where enabled.",
  path: "/lp/rent",
});

export default function LpRentPage() {
  return (
    <GrowthLpShell
      variant="rent"
      headline="Stays that feel like home"
      subhead="Explore BNHub stays with transparent pricing and booking flows designed to reduce back-and-forth."
      primaryCta={{ label: "Search stays", href: "/bnhub/stays" }}
      secondaryCta={{ label: "How BNHub works", href: "/bnhub" }}
      bullets={[
        "Availability and pricing surfaced before you commit",
        "Checkout with major cards where Stripe is enabled",
        "Support paths if something needs attention",
      ]}
    />
  );
}
