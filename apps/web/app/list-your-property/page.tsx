import type { Metadata } from "next";
import Link from "next/link";
import { GrowthConversionStrip } from "@/components/marketing/GrowthConversionStrip";
import { ListYourPropertyIntakeClient } from "./list-your-property-intake-client";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: `List your property | ${PLATFORM_NAME}`,
  description:
    "Submit your listing for review. We publish permission-based content only — no copying from other platforms.",
  robots: { index: true, follow: true },
};

export default function ListYourPropertyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl px-4">
        <Link href="/" className="text-sm text-amber-800 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">List your property</h1>
        <p className="mt-2 text-slate-600">
          Reach serious buyers and guests with direct inquiries. We can add your listing for you after you confirm
          permission — we never scrape or copy third-party sites.
        </p>
        <div className="mt-8">
          <ListYourPropertyIntakeClient />
        </div>
        <div className="mt-10">
          <GrowthConversionStrip variant="supply" />
        </div>
      </div>
    </main>
  );
}
