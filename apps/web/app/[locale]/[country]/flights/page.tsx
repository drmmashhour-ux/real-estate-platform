import Link from "next/link";

/**
 * Flights – API integration (placeholder until flight search/booking API is connected).
 */
export default function FlightsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Flights</h1>
          <p className="mt-1 text-sm text-slate-600">
            API integration — search & book flights (coming soon)
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">
            Flight search and booking will be available here via API integration.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
