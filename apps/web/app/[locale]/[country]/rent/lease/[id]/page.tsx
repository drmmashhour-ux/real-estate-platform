import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MvpNav } from "@/components/investment/MvpNav";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { RentDecisionAiCard } from "@/components/rental/RentDecisionAiCard";
import { LeaseSignClient } from "./lease-sign-client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Lease ${id.slice(0, 8)} · Rent Hub` };
}

export default async function RentLeasePage({ params }: Props) {
  const { id } = await params;
  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?next=/rent/lease/${id}`);
  }

  const lease = await prisma.rentalLease.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, listingCode: true, address: true } },
    },
  });
  if (!lease) notFound();
  if (lease.tenantId !== userId && lease.landlordId !== userId) {
    redirect("/rent");
  }

  const isTenant = lease.tenantId === userId;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-premium-gold">Rent Hub · Lease</p>
        <h1 className="mt-3 text-2xl font-bold">{lease.listing.title}</h1>
        <p className="mt-1 text-sm text-white/60">
          {lease.listing.listingCode} · {lease.listing.address}
        </p>
        <p className="mt-2 text-sm text-white/50">
          Term {lease.startDate.toISOString().slice(0, 10)} → {lease.endDate.toISOString().slice(0, 10)} · Status{" "}
          <span className="font-medium text-white/80">{lease.status}</span>
        </p>

        <div className="mt-8">
          <RentDecisionAiCard hub="rent" entityType="rental_lease" entityId={lease.id} title="Lease decision insight" />
        </div>

        {lease.status === "PENDING_SIGNATURE" && isTenant ? (
          <div className="mt-8">
            <LeaseSignClient leaseId={lease.id} contractText={lease.contractText} />
          </div>
        ) : (
          <div className="mt-8 space-y-4 text-sm text-[#B3B3B3]">
            {lease.status === "PENDING_SIGNATURE" && !isTenant ? (
              <p>Waiting for the tenant to review and sign the lease.</p>
            ) : null}
            {lease.status === "ACTIVE" ? (
              <p>
                This lease is active. View payments in{" "}
                <Link href="/dashboard/tenant/payments" className="text-premium-gold hover:underline">
                  tenant payments
                </Link>{" "}
                or{" "}
                <Link href="/dashboard/landlord/payments" className="text-premium-gold hover:underline">
                  landlord payments
                </Link>
                .
              </p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
