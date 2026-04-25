import type { Metadata } from "next";
import Link from "next/link";
import { BnhubConciergeClient } from "@/components/bnhub/BnhubConciergeClient";

export const metadata: Metadata = {
  title: "BNHub concierge — booking help",
  description: "Get quick help with BNHub stays in Montréal and Laval. Real humans, real listings.",
};

export default function BnhubConciergePage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/bnhub" className="text-sm font-semibold text-[#D4AF37]">
            ← BNHub
          </Link>
          <Link
            href="/en/ca/search/bnhub"
            className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Browse stays
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Need help booking?</h1>
        <p className="mt-3 text-sm text-white/60">
          Tell us what you&apos;re looking for — dates, neighbourhood, and budget. We&apos;ll route this to the BNHub
          team (no automated fake confirmations).
        </p>
        <BnhubConciergeClient />
      </div>
    </main>
  );
}
