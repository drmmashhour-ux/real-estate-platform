import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getListingById } from "@/lib/bnhub/listings";
import { getSellerDisclosure } from "@/lib/bnhub/seller-disclosure";
import { getGuestId } from "@/lib/auth/session";
import { getSellerDeclarationTitle } from "@/lib/i18n/messages";
import { getLocaleFromCookieStore } from "@/lib/i18n/locales";
import { SellerDisclosureForm } from "./seller-disclosure-form";

export default async function ListingDisclosurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listingId } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();
  const listing = await getListingById(listingId);
  if (!listing || listing.ownerId !== userId) notFound();
  const disclosure = await getSellerDisclosure(listingId);

  // SellerDisclosureForm (client) expects ISO strings, not Date objects.
  const initialDisclosure = disclosure
    ? {
        id: disclosure.id,
        structuralIssues: disclosure.structuralIssues,
        waterDamage: disclosure.waterDamage,
        renovations: disclosure.renovations,
        defects: disclosure.defects,
        formData: disclosure.formData,
        completedAt: disclosure.completedAt ? disclosure.completedAt.toISOString() : null,
        declinedAt: disclosure.declinedAt ? disclosure.declinedAt.toISOString() : null,
      }
    : null;

  const listingSnapshot = {
    address: listing.address,
    city: listing.city,
    cadastreNumber: listing.cadastreNumber,
    propertyType: listing.propertyType,
  };

  const cookieStore = await cookies();
  const locale = getLocaleFromCookieStore(cookieStore);
  const sellerDeclarationTitle = getSellerDeclarationTitle(locale);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/bnhub/host/listings/${listingId}/edit`}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to edit listing
          </Link>
          <h1 className="mt-4 text-xl font-semibold">{sellerDeclarationTitle}</h1>
          <p className="mt-1 text-slate-400">
            Disclose structural issues, water damage, renovations, and defects. Required before publishing. If you decline, this listing cannot be published.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <SellerDisclosureForm
          listingId={listingId}
          listingSnapshot={listingSnapshot}
          initialDisclosure={initialDisclosure}
        />
      </section>
    </main>
  );
}
