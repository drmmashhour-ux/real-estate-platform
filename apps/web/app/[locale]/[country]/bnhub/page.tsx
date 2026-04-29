import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `BNHub — Premium stays | ${seoConfig.siteName}`,
    description: "Short-term rentals — explore BNHub from LECIPM.",
    path: "/bnhub",
    locale,
    country,
  });
}

/** Local marketing gateway; root `/bnhub/*` still redirects to external BN Hub (middleware). */
export default function BNHubEntry() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-black px-6 text-center text-white">
      <h1 className="text-4xl font-bold">BNHub — Premium Short-Term Rentals</h1>
      <p className="mt-4 max-w-xl text-neutral-400">Discover high-quality stays powered by LECIPM.</p>
      <a
        href="https://bnhub.lecipm.com"
        rel="noopener noreferrer"
        className="mt-8 rounded-xl bg-[#C9A96A] px-8 py-4 font-semibold text-black transition hover:bg-[#E5C07B]"
      >
        Explore BNHub
      </a>
    </div>
  );
}
