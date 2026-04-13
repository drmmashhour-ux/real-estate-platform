import Link from "next/link";
import { notFound } from "next/navigation";
import { getPackageById } from "@/lib/travel-packages";
import { PackageBookingForm } from "./package-booking-form";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPackageById(id);

  if (!pkg) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link
            href="/packages"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← All packages
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{pkg.title}</h1>
          <p className="mt-1 text-slate-600">{pkg.location}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {pkg.duration && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {pkg.duration}
              </span>
            )}
            <span className="text-lg font-semibold text-slate-900">
              ${pkg.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {pkg.includes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Includes
              </h2>
              <ul className="mt-2 list-inside list-disc text-slate-700">
                {pkg.includes.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <hr className="my-8 border-slate-200" />

          <PackageBookingForm
            packageId={pkg.id}
            packageTitle={pkg.title}
            price={pkg.price}
          />
        </div>
      </div>
    </main>
  );
}
