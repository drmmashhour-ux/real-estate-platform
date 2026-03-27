import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMarketAnalysis } from "@/lib/market/analysis-service";
import { cityToSlug, slugToCity } from "@/lib/market/slug";
import { MarketCityCharts } from "@/components/market/MarketCityCharts";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { breadcrumbJsonLd } from "@/modules/seo/infrastructure/jsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = slugToCity(citySlug);
  if (!city.trim()) return { title: "Markets" };
  const slug = cityToSlug(city);
  const base = getSiteBaseUrl();
  const url = `${base}/market/${slug}`;
  const title = `${city} real estate market — trends, prices & ROI context | LECIPM`;
  const description = `Demand signals, average price trends, and rental yield context for ${city}. Illustrative — not financial advice.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function MarketCityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { city: citySlug } = await params;
  const sp = await searchParams;
  const city = slugToCity(citySlug);
  if (!city.trim()) notFound();

  const propertyType = (sp.type ?? "Residential").trim() || "Residential";

  const analysis = await buildMarketAnalysis(city, propertyType);

  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Markets", path: "/market" },
    { name: city, path: `/market/${cityToSlug(city)}` },
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <Link href="/market" className="text-sm text-slate-500 hover:underline">
        ← Markets
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
        Market trend analysis — {city}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Property type: {propertyType} · {analysis.label}</p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Trend: <strong className="capitalize">{analysis.trend.trend}</strong> · Market score (estimate):{" "}
          <strong>{analysis.marketScore}/100</strong> · Confidence: {analysis.confidence}/100
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <li>3-month price change (est.): {fmtPct(analysis.trend.priceGrowth3mPercent)}</li>
          <li>6-month price change (est.): {fmtPct(analysis.trend.priceGrowth6mPercent)}</li>
          <li>12-month price change (est.): {fmtPct(analysis.trend.priceGrowth12mPercent)}</li>
          <li>6-month rent change (est.): {fmtPct(analysis.trend.rentGrowth6mPercent)}</li>
        </ul>
        <div className="mt-4 text-sm text-slate-700 dark:text-slate-200">
          <p>Forecast avg. price (illustrative, not a guarantee):</p>
          <ul className="mt-2 list-disc pl-5">
            <li>3 months: ${(analysis.forecast.predictedPrice3Months / 100).toLocaleString()}</li>
            <li>6 months: ${(analysis.forecast.predictedPrice6Months / 100).toLocaleString()}</li>
            <li>12 months: ${(analysis.forecast.predictedPrice12Months / 100).toLocaleString()}</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/40">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">Insights</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {analysis.insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {analysis.series.length >= 2 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/40">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Charts</h2>
          <div className="mt-4">
            <MarketCityCharts series={analysis.series} />
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500">Add more monthly data points to see charts.</p>
      )}

      <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-white/20 dark:text-slate-400">
        <strong>Alerts (coming soon):</strong> save criteria (city, ROI target, trend condition) to be notified when
        conditions are met — not active yet.
      </div>

      <p className="mt-6 text-xs text-slate-500">{analysis.disclaimer}</p>
    </main>
  );
}

function fmtPct(v: number | null) {
  if (v == null) return "—";
  return `${v.toFixed(2)}%`;
}
