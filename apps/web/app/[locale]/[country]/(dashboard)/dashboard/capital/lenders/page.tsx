import type { Metadata } from "next";
import Link from "next/link";
import { CapitalHubClient } from "@/components/capital-console/capital-hub-client";

export const metadata: Metadata = {
  title: "Lender relationships · LECIPM",
};

export default async function CapitalLendersPage({
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
      <h1 className="text-2xl font-semibold tracking-tight">Lender relationships</h1>
      <p className="text-sm text-muted-foreground">
        Open a deal row to manage lenders. Overview metrics below reflect your visible pipeline.
      </p>
      <CapitalHubClient localeCountryPrefix={prefix} />
    </div>
  );
}
