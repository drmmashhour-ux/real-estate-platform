import Link from "next/link";
import { notFound } from "next/navigation";
import { MvpNav } from "@/components/investment/MvpNav";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { RentalApplyCta } from "./rental-apply-cta";

function formatMoneyCents(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}

export async function RentalListingDetail({ listingId }: { listingId: string }) {
  const viewerId = await getGuestId();
  const row = await prisma.rentalListing.findUnique({
    where: { id: listingId },
    include: { landlord: { select: { id: true, name: true } } },
  });
  if (!row) notFound();

  const isOwner = viewerId != null && row.landlordId === viewerId;
  const tenantLease =
    viewerId != null && row.status === "RENTED"
      ? await prisma.rentalLease.findFirst({
          where: { listingId: row.id, tenantId: viewerId },
          select: { id: true, status: true },
        })
      : null;
  const isTenantOfRecord = Boolean(tenantLease);
  if (row.status === "DRAFT" && !isOwner) notFound();
  if (row.status === "RENTED" && !isOwner && !isTenantOfRecord) notFound();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A646]">Long-term · Rent Hub</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{row.title}</h1>
        <p className="mt-2 text-sm text-white/60">
          Code: <span className="font-mono text-white/80">{row.listingCode}</span>
          {row.city ? ` · ${row.city}` : ""}
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-white/50">Monthly rent</p>
              <p className="text-lg font-semibold text-white">{formatMoneyCents(row.priceMonthly)}</p>
            </div>
            <div>
              <p className="text-white/50">Security deposit</p>
              <p className="text-lg font-semibold text-white">{formatMoneyCents(row.depositAmount)}</p>
            </div>
            <div>
              <p className="text-white/50">Status</p>
              <p className="text-lg font-semibold capitalize text-white">{row.status.toLowerCase()}</p>
            </div>
          </div>
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[#B3B3B3]">{row.description}</p>
          <p className="mt-4 text-sm text-white/70">{row.address}</p>
        </div>

        {row.status === "ACTIVE" && !isOwner ? (
          <RentalApplyCta listingId={row.id} />
        ) : isTenantOfRecord && tenantLease ? (
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/rent/lease/${tenantLease.id}`}
              className="rounded-xl px-5 py-2.5 font-bold text-[#0B0B0B]"
              style={{ background: "#C9A646" }}
            >
              Open lease ({tenantLease.status.replace("_", " ").toLowerCase()})
            </Link>
            <Link href="/rent" className="rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white hover:bg-white/5">
              Back to search
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            {isOwner ? (
              <Link
                href="/dashboard/landlord"
                className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/5"
              >
                Landlord dashboard
              </Link>
            ) : null}
            <Link href="/rent" className="rounded-xl px-4 py-2 font-semibold text-[#0B0B0B] hover:opacity-90" style={{ background: "#C9A646" }}>
              Back to search
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
