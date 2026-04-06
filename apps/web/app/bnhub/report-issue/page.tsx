import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getListingById } from "@/lib/bnhub/listings";
import { TrustSafetyReportForm } from "./trust-safety-report-form";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ listingId?: string; bookingId?: string }> };

export default async function TrustSafetyReportPage({ searchParams }: Props) {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const params = (await searchParams) ?? {};
  const listingId = params.listingId?.trim() || null;
  const bookingId = params.bookingId?.trim() || null;

  let listingTitle: string | undefined;
  if (listingId) {
    const listing = await getListingById(listingId);
    listingTitle = listing?.title;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Link
            href={listingId ? `/bnhub/${listingId}` : "/bnhub/stays"}
            className="text-sm font-medium text-slate-400 hover:text-slate-200"
          >
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Report an issue</h1>
          <p className="mt-2 text-sm text-slate-400">
            Report misleading listing, fraud, or poor condition. Our trust & safety team will review.
          </p>
          {listingTitle && (
            <p className="mt-1 text-sm text-slate-500">Listing: {listingTitle}</p>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-8">
        <TrustSafetyReportForm
          listingId={listingId}
          bookingId={bookingId}
          listingTitle={listingTitle}
          backHref={listingId ? `/bnhub/${listingId}` : "/bnhub/stays"}
          backLabel={listingId ? "Back to listing" : "Back to search"}
        />
      </section>
    </main>
  );
}
