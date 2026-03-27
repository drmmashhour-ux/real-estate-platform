import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Sell by yourself",
  description: `List and sell FSBO-style on ${PLATFORM_NAME} — publish, photos, and inquiries from your dashboard.`,
};

export default function SellingByYourselfPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/selling" className="text-sm font-medium text-[#C9A646] hover:underline">
        ← Selling
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Selling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sell by yourself</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Use {PLATFORM_NAME} to publish your listing, upload photos and documents, and manage buyer inquiries from your
        seller dashboard — without a mandatory brokerage package.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/sell"
          className="rounded-full bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
        >
          Start a listing
        </Link>
        <Link
          href="/dashboard/fsbo"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#C9A646]/40 hover:text-[#C9A646]"
        >
          FSBO dashboard
        </Link>
      </div>
    </div>
  );
}
