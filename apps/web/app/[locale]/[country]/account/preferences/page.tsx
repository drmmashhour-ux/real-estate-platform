import type { Metadata } from "next";
import { AccountPreferencesClient } from "@/components/user-intelligence/AccountPreferencesClient";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";

type PageProps = { params: Promise<{ locale: string; country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Housing preferences | ${seoConfig.siteName}`,
    description: "Review how LECIPM remembers your housing-related choices for search and matches.",
    path: "/account/preferences",
    locale,
    country,
  });
}

export default function AccountPreferencesPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold">Housing & search preferences</h1>
        <p className="mt-2 text-sm text-slate-400">
          We store product-relevant signals (what you choose in forms and how you use search), not your background. You can add
          an explicit key/value below; Dream Home and other tools also build this over time.
        </p>
        <div className="mt-8">
          <AccountPreferencesClient />
        </div>
      </div>
    </main>
  );
}
