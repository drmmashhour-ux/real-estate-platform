import type { Metadata } from "next";
import Link from "next/link";
import { ClosingDealDetailClient } from "@/components/closing-console/closing-deal-detail-client";

export const metadata: Metadata = {
  title: "Deal closing · LECIPM",
};

export default async function ClosingDealPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; dealId: string }>;
}) {
  const { locale, country, dealId } = await params;
  const prefix = `/${locale}/${country}`;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`${prefix}/dashboard/closing`} className="text-primary underline-offset-4 hover:underline">
          ← Closing hub
        </Link>
        <Link href={`${prefix}/dashboard/closing/room/${dealId}`} className="text-primary underline-offset-4 hover:underline">
          Secure room view
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Closing workspace</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{dealId}</p>
      </div>
      <ClosingDealDetailClient dealId={dealId} />
    </div>
  );
}
