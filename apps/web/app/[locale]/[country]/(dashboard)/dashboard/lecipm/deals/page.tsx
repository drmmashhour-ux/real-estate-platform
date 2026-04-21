import type { Metadata } from "next";

import { DealsConsoleClient } from "@/components/lecipm-console/deals-console-client";

export const metadata: Metadata = {
  title: "Deals · LECIPM Console",
};

export default async function LecipmConsoleDealsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return <DealsConsoleClient localeCountryPrefix={`/${locale}/${country}`} />;
}
