import { ContentCalendarClient } from "@/components/marketing/ContentCalendarClient";

export const dynamic = "force-dynamic";

export default async function MarketingContentCalendarPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const marketingHubHref = `/${locale}/${country}/dashboard/marketing`;

  return (
    <div className="mx-auto max-w-6xl p-6 text-white">
      <ContentCalendarClient marketingHubHref={marketingHubHref} />
    </div>
  );
}
