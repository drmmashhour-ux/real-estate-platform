import type { Metadata } from "next";
import { GrowthLpShell } from "@/components/growth/GrowthLpShell";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Buy with confidence — LECIPM",
  description:
    "Browse verified listings where shown, compare options, and connect with professionals when you are ready to move.",
  path: "/lp/buy",
});

export default function LpBuyPage() {
  return (
    <GrowthLpShell
      variant="buy"
      headline="Find the right home — without the noise"
      subhead="Search listings, save what fits, and reach out to brokers when you are ready. Built for serious buyers in Québec."
      primaryCta={{ label: "Browse listings", href: "/listings" }}
      secondaryCta={{
        label: "Talk to a broker",
        href: "/join-broker",
      }}
      secondaryIntent="broker_lead"
      bullets={[
        "Unified search across marketplace inventory where available",
        "Clear next steps — no forced calls before you are ready",
        "Platform rules and disclosures where applicable",
      ]}
    />
  );
}
