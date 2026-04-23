import { AiContentGeneratorClient } from "@/components/marketing/AiContentGeneratorClient";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function MarketingAiContentPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;
  const marketingHubHref = `${base}/marketing`;
  const calendarHref = `${base}/marketing/calendar`;
  const autonomousEngineHref = `${base}/admin/marketing/ai`;
  const growthBrainHref = `${base}/admin/growth-brain`;

  return (
    <div className="mx-auto max-w-5xl p-4 text-white md:p-6">
      <h1 className="text-2xl font-bold">AI Content Generator</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Video ideas, short-form scripts, captions, and a one-day plan — connected to the calendar, autonomous engine, and
        growth brain workflows.
      </p>
      <div className="mt-6">
        <AiContentGeneratorClient
          marketingHubHref={marketingHubHref}
          calendarHref={calendarHref}
          autonomousEngineHref={autonomousEngineHref}
          growthBrainHref={growthBrainHref}
        />
      </div>
    </div>
  );
}
