import type { Metadata } from "next";

import { ComplianceConsoleClient } from "@/components/lecipm-console/compliance-console-client";

export const metadata: Metadata = {
  title: "Compliance · LECIPM Console",
};

export default async function LecipmConsoleCompliancePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return <ComplianceConsoleClient localeCountryPrefix={`/${locale}/${country}`} />;
}
