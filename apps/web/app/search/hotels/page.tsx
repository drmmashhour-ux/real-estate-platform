import Link from "next/link";
import { HotelSearchClient } from "./hotel-search-client";

export default function HotelSearchPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/search/hotels"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Hotel Hub
          </Link>
          <Link
            href="/dashboard/hotel"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <HotelSearchClient />
    </main>
  );
}
