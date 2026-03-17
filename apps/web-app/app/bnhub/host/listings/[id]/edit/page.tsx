import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingById } from "@/lib/bnhub/listings";
import { EditListingForm } from "./edit-listing-form";

export default async function HostEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Host dashboard
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Edit listing</h1>
          <p className="mt-1 text-slate-400">{listing.title}</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <EditListingForm listing={listing} />
      </section>
    </main>
  );
}
