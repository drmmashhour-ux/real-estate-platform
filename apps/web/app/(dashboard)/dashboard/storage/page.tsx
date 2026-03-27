import Link from "next/link";
import { Suspense } from "react";
import { PostUpgradeSuccessBanner } from "@/src/modules/closing/ui/PostUpgradeSuccessBanner";
import { StoragePageContent } from "./storage-page-content";

export const dynamic = "force-dynamic";

export default function DashboardStoragePage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/dashboard/listings" className="font-medium text-[#C9A96E] hover:underline">
            ← Dashboard
          </Link>
          <span className="text-slate-500">·</span>
          <Link href="/dashboard/listings" className="text-slate-400 hover:text-slate-200">
            Listings
          </Link>
          <Link href="/dashboard/billing" className="text-slate-400 hover:text-slate-200">
            Billing
          </Link>
          <span className="text-slate-500">Storage</span>
        </nav>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#C9A96E]">Storage</h1>
        <p className="mt-1 text-slate-400">
          Usage, limits, and optimization. Upgrade your plan for more space.
        </p>
        <Suspense fallback={null}>
          <PostUpgradeSuccessBanner />
        </Suspense>
        <StoragePageContent />
      </div>
    </main>
  );
}
