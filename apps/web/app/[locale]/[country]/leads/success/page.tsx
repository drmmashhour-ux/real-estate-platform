import Link from "next/link";

export default function LeadCheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-emerald-300">Payment successful</h1>
        <p className="mt-2 text-lg font-medium text-white">Access unlocked</p>
        <p className="mt-3 text-sm text-slate-400">
          Refresh the listing page to view the representative&apos;s phone and email. If details don&apos;t appear within a
          minute, open the listing again — the webhook may still be processing.
        </p>
        <Link href="/listings" className="mt-8 inline-block text-sm font-medium text-amber-400 hover:text-amber-300">
          Back to listings
        </Link>
      </div>
    </main>
  );
}
