import Link from "next/link";
import { BillingContent } from "./billing-content";
import { StorageUsageBar } from "../components/storage-usage-bar";
import { StorageAlert } from "../components/storage/StorageAlert";
import { StorageDashboardCards } from "../components/storage/StorageDashboardCards";

export const dynamic = "force-dynamic";

export default function BillingPage() {
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
          <span className="text-slate-500">Billing</span>
          <Link href="/dashboard/storage" className="text-slate-400 hover:text-slate-200">
            Storage
          </Link>
        </nav>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#C9A96E]">Billing &amp; invoices</h1>
        <p className="mt-1 text-sm text-slate-400">
          Canva usage: 7-day free trial, then $5 per design. View invoices and download PDFs.
        </p>

        <section className="mt-6 rounded-xl border border-[#C9A96E]/20 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-[#C9A96E]">Storage</h2>
          <div className="mt-3 space-y-4">
            <StorageAlert />
            <StorageUsageBar />
            <StorageDashboardCards />
          </div>
        </section>

        <BillingContent />
      </div>
    </main>
  );
}
