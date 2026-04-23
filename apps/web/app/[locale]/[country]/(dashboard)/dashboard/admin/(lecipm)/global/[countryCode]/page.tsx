import { GlobalCountryDetailClient } from "@/modules/global-expansion/components/GlobalCountryDetailClient";

export const dynamic = "force-dynamic";

export default async function GlobalCountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; countryCode: string }>;
}) {
  const { locale, country, countryCode } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const code = decodeURIComponent(countryCode).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950">
      <GlobalCountryDetailClient countryCode={code} adminBase={adminBase} />
    </div>
  );
}
