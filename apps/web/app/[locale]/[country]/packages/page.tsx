import Link from "next/link";
import { getPackages } from "@/lib/travel-packages";

export default async function PackagesPage() {
  const packages = await getPackages();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Travel packages
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare destinations and book bundled trips in one place.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {packages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No packages available yet.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <li key={pkg.id}>
                <Link
                  href={`/packages/${pkg.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <h2 className="font-semibold text-slate-900">{pkg.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {pkg.location}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    {pkg.duration && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                        {pkg.duration}
                      </span>
                    )}
                    <span className="font-semibold text-slate-900">
                      ${pkg.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
