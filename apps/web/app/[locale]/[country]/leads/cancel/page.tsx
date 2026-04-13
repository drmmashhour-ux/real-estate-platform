import Link from "next/link";

export default function LeadCheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-slate-200">Checkout cancelled</h1>
        <p className="mt-3 text-sm text-slate-400">No charge was made. You can return to the listing and try again.</p>
        <Link href="/listings" className="mt-8 inline-block text-sm font-medium text-amber-400 hover:text-amber-300">
          Browse listings
        </Link>
      </div>
    </main>
  );
}
