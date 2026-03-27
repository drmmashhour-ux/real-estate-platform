import Link from "next/link";
import { listDistinctCitiesWithData } from "@/lib/market/data";
import { cityToSlug } from "@/lib/market/slug";

export const dynamic = "force-dynamic";

export default async function MarketIndexPage() {
  const cities = await listDistinctCitiesWithData();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Market trend analysis</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Browse city-level estimates based on data in our system — not guarantees.
      </p>

      {cities.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No market data yet. Admins can upload CSV under{" "}
          <Link href="/admin/market" className="underline">
            Admin → Market data
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 space-y-2">
          {cities.map((c) => (
            <li key={c}>
              <Link
                href={`/market/${cityToSlug(c)}`}
                className="text-slate-900 underline dark:text-[#C9A646]"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
