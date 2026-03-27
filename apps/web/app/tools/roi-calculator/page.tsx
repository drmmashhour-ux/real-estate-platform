import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { RoiCalculatorClient } from "./RoiCalculatorClient";

const path = "/tools/roi-calculator";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteBaseUrl();
  const url = `${base}${path}`;
  return {
    title: "Real estate ROI calculator — cap rate & cash-on-cash",
    description:
      "Estimate gross yield, cap rate, and illustrative cash-on-cash for rental properties. Decision-intent SEO tool — not financial advice.",
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: "ROI calculator for investment property | LECIPM",
      description: "Cap rate, gross yield, and mortgage-aware cash-on-cash — illustrative only.",
      url,
      type: "website",
    },
  };
}

export default function RoiCalculatorPage() {
  return (
    <ToolShell
      title="ROI calculator"
      subtitle="Illustrative rental math — cap rate, gross yield, and rough cash-on-cash."
    >
      <RoiCalculatorClient />
    </ToolShell>
  );
}
