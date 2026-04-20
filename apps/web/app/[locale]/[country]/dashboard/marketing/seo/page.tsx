import Link from "next/link";
import { SeoEnginePanel } from "./seo-engine-panel";

export const dynamic = "force-dynamic";

export default async function MarketingSeoEnginePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const marketingHref = `/${locale}/${country}/dashboard/marketing`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-white">
      <nav className="flex flex-wrap gap-2 text-sm text-zinc-500">
        <Link href={marketingHref} className="hover:text-emerald-400">
          ← Marketing Hub
        </Link>
      </nav>
      <header>
        <h1 className="text-2xl font-bold">SEO Engine</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-500">
          Keywords, metadata drafts, landing candidates, content briefs, internal linking, and performance placeholders —
          optimized for Québec & Canadian markets; review before publish.
        </p>
      </header>
      <SeoEnginePanel locale={locale} country={country} />
    </div>
  );
}
