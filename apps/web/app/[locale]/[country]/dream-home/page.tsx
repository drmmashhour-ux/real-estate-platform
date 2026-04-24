import type { Metadata } from "next";
import { DreamHomeWizard } from "@/components/dream-home/DreamHomeWizard";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";

type PageProps = { params: Promise<{ locale: string; country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `AI Dream Home Match | ${seoConfig.siteName}`,
    description:
      "Build a dream-home profile from your own preferences—no stereotyping—and browse matching LECIPM listings.",
    path: "/dream-home",
    locale,
    country,
  });
}

export default async function DreamHomePage({ params }: PageProps) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}`;

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#2f2308,transparent_30%),linear-gradient(180deg,#0b0b0b,#111827)]">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-premium-gold">AI Dream Home Match</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Find a home that fits what you want</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300">
            Tell us your lifestyle, space needs, and budget. We use only what you provide—no guessing from nationality
            or background—and return a clear profile, filters, and ranked listings.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <DreamHomeWizard basePath={basePath} />
      </div>
    </main>
  );
}
