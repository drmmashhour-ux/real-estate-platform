import Link from "next/link";
import { getPublicMortgageExpertsList } from "@/modules/mortgage/services/public-experts";
import { ExpertsDirectoryClient } from "./experts-directory-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mortgage expert marketplace",
  description: "Compare rated mortgage experts — deals closed, reviews, and priority tiers.",
};

export default async function ExpertsMarketplacePage() {
  const experts = await getPublicMortgageExpertsList();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A646]">Marketplace</p>
            <h1 className="mt-1 text-2xl font-bold">Mortgage experts</h1>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/mortgage" className="text-[#C9A646] hover:underline">
              Get a match
            </Link>
            <Link href="/" className="text-[#737373] hover:text-white">
              Home
            </Link>
          </div>
        </div>
      </header>
      <ExpertsDirectoryClient experts={experts} />
    </main>
  );
}
