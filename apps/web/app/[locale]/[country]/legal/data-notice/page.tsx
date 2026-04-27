import Link from "next/link";
import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Data usage notice (Law 25)",
    description: "How LECIPM processes personal information in Québec.",
    path: "/legal/data-notice",
  });
}

export default async function DataNoticePage({ params }: { params: Promise<{ locale: string; country: string }> }) {
  const { locale, country } = await params;
  const home = `/${locale}/${country}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href={home} className="text-sm text-muted-foreground hover:underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Data usage notice</h1>
      <p className="mt-2 text-sm text-muted-foreground">Québec — Law 25 (Act respecting the protection of personal information)</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          LECIPM collects and uses personal information to operate accounts, listings, bookings, payments (via our
          payment processor), and compliance obligations (including OACIQ-related declarations where applicable). We
          do not sell your personal information.
        </p>
        <p>
          Analytics and product improvement may use aggregated or de-identified data. You may contact support to access
          or correct your information, subject to legal exceptions.
        </p>
        <p className="text-xs text-muted-foreground">
          This notice is informational and does not replace legal advice. Internal policies and data processing
          agreements may apply to enterprise customers.
        </p>
      </div>
    </main>
  );
}
