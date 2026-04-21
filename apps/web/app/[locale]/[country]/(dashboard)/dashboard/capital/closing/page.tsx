import type { Metadata } from "next";
import Link from "next/link";
import { CapitalHubClient } from "@/components/capital-console/capital-hub-client";

export const metadata: Metadata = {
  title: "Closing readiness · LECIPM",
};

export default async function CapitalClosingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href={`${prefix}/dashboard/capital`} className="text-sm text-primary underline-offset-4 hover:underline">
        ← Capital hub
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Closing readiness queue</h1>
      <p className="text-sm text-muted-foreground">
        Deals with critical financing conditions open are highlighted in the pipeline summary. Open each deal for the
        detailed readiness panel.
      </p>
      <CapitalHubClient localeCountryPrefix={prefix} />
    </div>
  );
}
