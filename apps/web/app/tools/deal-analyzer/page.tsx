import type { Metadata } from "next";
import Link from "next/link";
import { ToolShell, LegalDisclaimerBlock } from "@/components/tools/ToolShell";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

const path = "/tools/deal-analyzer";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteBaseUrl();
  const url = `${base}${path}`;
  return {
    title: "Deal analyzer — is this property a good investment?",
    description:
      "How LECIPM scores listings for trust, deal quality, and ROI context. Links to market data and listing analysis pages.",
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: "Investment property deal analyzer | LECIPM",
      description: "Trust + deal signals + ROI-style context — not a guarantee.",
      url,
      type: "website",
    },
  };
}

export default function DealAnalyzerToolPage() {
  return (
    <ToolShell
      title="Deal analyzer"
      subtitle="Decision-intent framing: trust, deal quality, and illustrative ROI — aligned with our public listing analysis pages."
    >
      <div className="space-y-6 text-sm text-slate-300">
        <p>
          We combine <strong className="text-white">listing trust signals</strong>,{" "}
          <strong className="text-white">investment-style deal scores</strong>, and{" "}
          <strong className="text-white">market context</strong> so buyers answer “is this a good deal?” faster than on
          generic portals.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Browse FSBO inventory and open any listing — when enabled, you&apos;ll see structured deal output on the
            listing and on public analysis URLs.
          </li>
          <li>
            Pair with{" "}
            <Link href="/tools/roi-calculator" className="text-[#C9A646] hover:underline">
              ROI calculator
            </Link>{" "}
            for cap-rate and cash-on-cash what-ifs.
          </li>
          <li>
            Explore{" "}
            <Link href="/market" className="text-[#C9A646] hover:underline">
              city market pages
            </Link>{" "}
            for trend and demand context.
          </li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sell"
            className="rounded-lg border border-[#C9A646]/40 bg-[#C9A646]/10 px-4 py-2 text-sm font-medium text-[#E8C547] hover:bg-[#C9A646]/20"
          >
            View listings
          </Link>
          <Link href="/evaluate" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:border-[#C9A646]/40">
            Property evaluation
          </Link>
        </div>
        <LegalDisclaimerBlock />
      </div>
    </ToolShell>
  );
}
