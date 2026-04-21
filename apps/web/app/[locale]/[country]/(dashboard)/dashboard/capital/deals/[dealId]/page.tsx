import type { Metadata } from "next";
import Link from "next/link";
import { CapitalDealDetailClient } from "@/components/capital-console/capital-deal-detail-client";

export const metadata: Metadata = {
  title: "Deal financing · LECIPM",
};

export default async function CapitalDealPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  const prefix = `/${locale}/${country}`;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href={`${prefix}/dashboard/capital`} className="text-sm text-primary underline-offset-4 hover:underline">
        ← Capital hub
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financing workspace</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{dealId}</p>
      </div>
      <CapitalDealDetailClient dealId={dealId} />
    </div>
  );
}
