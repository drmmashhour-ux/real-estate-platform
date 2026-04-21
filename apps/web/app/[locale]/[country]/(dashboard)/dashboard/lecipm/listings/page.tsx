import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components";

export const metadata: Metadata = {
  title: "Listings · LECIPM Console",
};

const primaryLink =
  "inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 font-semibold text-black shadow-md shadow-gold/20 transition duration-200 hover:bg-premium-gold-hover hover:shadow-[0_0_28px_rgb(212_175_55_/_0.35)]";

const ghostLink =
  "inline-flex items-center justify-center rounded-lg border border-gold/40 px-6 py-3 font-semibold text-gold transition hover:bg-gold/10";

export default async function LecipmConsoleListingsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Listings</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Workspace inventory overview — connect listing APIs here. Production CRM listings use the existing dashboard route.
        </p>
      </div>
      <Card>
        <p className="text-neutral-400">
          Listing index and filters will load from your backend. Until then, open the CRM listings workspace for live data.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`${prefix}/dashboard/listings`} className={primaryLink}>
            Open CRM listings
          </Link>
          <Link href={`${prefix}/dashboard/listings/assistant`} className={ghostLink}>
            Full AI assistant
          </Link>
        </div>
      </Card>
    </div>
  );
}
