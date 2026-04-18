import type { Metadata } from "next";
import { GrowthLpShell } from "@/components/growth/GrowthLpShell";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Invest smarter — LECIPM",
  description:
    "Evaluate deals, compare scenarios, and move with data — investment tools built for disciplined decisions.",
  path: "/lp/invest",
});

export default function LpInvestPage() {
  return (
    <GrowthLpShell
      variant="invest"
      headline="Underwrite deals with clarity"
      subhead="Use the investment workspace to analyze returns, stress assumptions, and keep your pipeline organized."
      primaryCta={{ label: "Open analyzer", href: "/analyze" }}
      secondaryCta={{ label: "Investment hub", href: "/investor" }}
      bullets={[
        "Scenario modeling without spreadsheet chaos",
        "Designed for repeat investors and advisors",
        "Aligned with platform disclosure and eligibility rules",
      ]}
    />
  );
}
