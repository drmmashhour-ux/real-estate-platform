import type { Metadata } from "next";

import { SeoCityAdminClient } from "./SeoCityAdminClient";

type PageProps = { params: Promise<{ locale: string; country: string }> };

export const metadata: Metadata = {
  title: "SEO — City engine",
  robots: { index: false, follow: false },
};

export default async function AdminSeoCityPage({ params }: PageProps) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">SEO — City pages engine</h1>
      <p className="mt-2 text-sm text-slate-600">
        Rollout, links, and optional client-side copy overrides. See <code className="text-slate-800">docs/seo/seo-city-engine.md</code>.
      </p>
      <div className="mt-8">
        <SeoCityAdminClient country={country} locale={locale} base={base} />
      </div>
    </div>
  );
}
