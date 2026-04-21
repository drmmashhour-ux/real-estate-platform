import type { Metadata } from "next";
import { CapitalHubClient } from "@/components/capital-console/capital-hub-client";

export const metadata: Metadata = {
  title: "Capital & financing · LECIPM",
};

export default async function CapitalDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Capital & financing spine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Financing pipeline, lender packages, offers, conditions, and closing readiness.
        </p>
      </div>
      <CapitalHubClient localeCountryPrefix={`/${locale}/${country}`} />
    </div>
  );
}
