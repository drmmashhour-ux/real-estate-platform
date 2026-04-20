import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateRentalListingCode } from "@/lib/codes/generate-code";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { RentDecisionAiCard } from "@/components/rental/RentDecisionAiCard";
import { LandlordRentApplications } from "./landlord-rent-client";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";
import { legalHubFlags } from "@/config/feature-flags";
import { LegalHubEntryCard } from "@/components/legal/LegalHubEntryCard";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default async function LandlordRentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const { userId } = await requireAuthenticatedUser();

  const [listings, applications] = await Promise.all([
    prisma.rentalListing.findMany({
      where: { landlordId: userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.rentalApplication.findMany({
      where: { listing: { landlordId: userId } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        listing: { select: { id: true, title: true, listingCode: true } },
        tenant: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const firstListingId = listings[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 text-slate-100">
      <HubJourneyBanner hub="landlord" locale={locale} country={country} userId={userId} />
      {legalHubFlags.legalHubV1 ? (
        <LegalHubEntryCard href={`/${locale}/${country}/legal?actor=landlord`} locale={locale} country={country} />
      ) : null}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">Rent Hub</p>
        <h1 className="mt-1 text-3xl font-semibold">Landlord dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Manage long-term listings, review applications, and track rent payments.
        </p>
      </header>

      <RentDecisionAiCard hub="rent" entityType="platform" entityId={null} title="AI Tenant Risk" />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-medium">Your listings</h2>
          <p className="text-xs text-slate-500">
            <Link href="/rent" className="text-amber-400 hover:underline">
              Public search
            </Link>
            {" · "}
            <Link href="/dashboard/landlord/payments" className="text-amber-400 hover:underline">
              Payments
            </Link>
          </p>
        </div>

        {firstListingId ? (
          <RentDecisionAiCard
            hub="rent"
            entityType="rental_listing"
            entityId={firstListingId}
            title="AI Tenant Risk"
          />
        ) : null}

        {applications.filter((a) => a.status === "PENDING").length > 0 ? (
          <RentDecisionAiCard
            hub="rent"
            entityType="rental_application"
            entityId={applications.find((a) => a.status === "PENDING")?.id ?? null}
            title="AI Tenant Risk"
          />
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Rent</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No listings yet. Create one with the form below.
                  </td>
                </tr>
              ) : (
                listings.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-amber-200/90">{l.listingCode}</td>
                    <td className="px-4 py-3">
                      <Link href={`/rent/${l.id}`} className="text-white hover:underline">
                        {l.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{money(l.priceMonthly)}</td>
                    <td className="px-4 py-3 text-slate-400">{l.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <LandlordCreateListingForm />
      </section>

      <section>
        <h2 className="text-lg font-medium">Applications</h2>
        <div className="mt-4">
          <LandlordRentApplications
            initial={applications.map((a) => ({
              ...a,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}

function LandlordCreateListingForm() {
  return (
    <form
      className="rounded-2xl border border-white/10 bg-slate-900/40 p-5"
      action={createListingAction}
    >
      <h3 className="text-sm font-semibold text-white">New listing</h3>
      <p className="mt-1 text-xs text-slate-500">Creates an active long-term listing visible in /rent search.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Title
          <input name="title" required className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" placeholder="Bright 2BR near metro" />
        </label>
        <label className="block text-xs text-slate-400">
          City
          <input name="city" className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" placeholder="Montreal" />
        </label>
      </div>
      <label className="mt-3 block text-xs text-slate-400">
        Address
        <input name="address" required className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
      </label>
      <label className="mt-3 block text-xs text-slate-400">
        Description
        <textarea name="description" required rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Monthly rent (cents)
          <input name="priceMonthly" type="number" required min={1} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" placeholder="220000" />
        </label>
        <label className="block text-xs text-slate-400">
          Deposit (cents)
          <input name="depositAmount" type="number" required min={0} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" placeholder="220000" />
        </label>
      </div>
      <button type="submit" className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">
        Publish listing
      </button>
    </form>
  );
}

async function createListingAction(formData: FormData) {
  "use server";
  const { userId } = await requireAuthenticatedUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const priceMonthly = Number(formData.get("priceMonthly"));
  const depositAmount = Number(formData.get("depositAmount"));
  if (!title || !description || !address || !Number.isFinite(priceMonthly)) return;

  await prisma.$transaction(async (tx) => {
    const listingCode = await generateRentalListingCode(tx);
    await tx.rentalListing.create({
      data: {
        listingCode,
        landlordId: userId,
        title,
        description,
        address,
        city,
        priceMonthly: Math.round(priceMonthly),
        depositAmount: Number.isFinite(depositAmount) ? Math.round(depositAmount) : 0,
        status: "ACTIVE",
      },
    });
  });
  redirect("/dashboard/landlord");
}
