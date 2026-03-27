import Link from "next/link";
import { redirect } from "next/navigation";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { ensureFsboListingListingCode } from "@/lib/fsbo/ensure-fsbo-listing-code";
import { fsboListingLifecycleUx } from "@/lib/fsbo/listing-verification";
import { SellerHubListingActions } from "@/components/seller/SellerHubListingActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { SellerPublishReadinessAiCard } from "@/components/ai/SellerPublishReadinessAiCard";

export const dynamic = "force-dynamic";

function badgeClass(ux: ReturnType<typeof fsboListingLifecycleUx>, status: string) {
  if (status === "SOLD") return "bg-violet-500/20 text-violet-200";
  if (ux === "active") return "bg-emerald-500/20 text-emerald-300";
  if (ux === "draft") return "bg-slate-600/40 text-slate-300";
  if (ux === "rejected") return "bg-red-500/20 text-red-300";
  return "bg-amber-500/20 text-amber-200";
}

function badgeLabel(ux: ReturnType<typeof fsboListingLifecycleUx>, status: string) {
  if (status === "SOLD") return "SOLD";
  if (ux === "active") return "PUBLISHED";
  if (ux === "draft") return "DRAFT";
  if (ux === "rejected") return "REJECTED";
  return "PENDING";
}

function canOwnerDelete(status: string) {
  return status !== "ACTIVE" && status !== "SOLD";
}

export default async function SellerHubDashboardRoutePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/seller/dashboard");

  let listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      verification: true,
      documents: { select: { fileUrl: true } },
    },
  });

  for (const row of listings) {
    if (!row.listingCode?.trim()) {
      await prisma.$transaction(async (tx) => {
        await ensureFsboListingListingCode(tx, row.id);
      });
    }
  }

  listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      verification: true,
      documents: { select: { fileUrl: true } },
    },
  });

  const immoCounts = await prisma.lead.groupBy({
    by: ["fsboListingId"],
    where: {
      fsboListingId: { in: listings.map((x) => x.id) },
      contactOrigin: LeadContactOrigin.IMMO_CONTACT,
    },
    _count: { _all: true },
  });
  const immoByListing = new Map(immoCounts.map((g) => [g.fsboListingId, g._count._all]));

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Seller dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Manage listings, documents, and publishing.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/seller/onboarding"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Onboarding
            </Link>
            <Link
              href="/seller/create-listing"
              className="rounded-xl bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black"
            >
              New listing
            </Link>
          </div>
        </div>

        {listings[0] ? (
          <div className="mt-8">
            <SellerPublishReadinessAiCard
              listing={{
                id: listings[0].id,
                title: listings[0].title,
                city: listings[0].city,
                status: listings[0].status,
                moderationStatus: listings[0].moderationStatus,
                docsUploaded: listings[0].documents.filter((d) => Boolean(d.fileUrl?.trim())).length,
                declarationDone: Boolean(listings[0].sellerDeclarationCompletedAt),
              }}
            />
          </div>
        ) : null}

        <ul className="mt-8 space-y-4">
          {listings.map((l) => {
            const ux = fsboListingLifecycleUx(l.status, l.moderationStatus, l.verification);
            const docsUploaded = l.documents.filter((d) => Boolean(d.fileUrl?.trim())).length;
            const immoN = immoByListing.get(l.id) ?? 0;
            return (
              <li key={l.id} className="rounded-2xl border border-white/10 bg-[#121212] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/listings/${l.id}`} className="font-medium text-[#E8C547] hover:underline">
                      {l.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {l.city} · updated {l.updatedAt.toLocaleDateString()}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      Listing code · <span className="text-slate-300">{l.listingCode ?? "—"}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ImmoContact inquiries · <span className="text-slate-300">{immoN}</span>
                    </p>
                    <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-[11px] text-slate-500">
                      <li>
                        <span className="text-slate-600">Created</span> · {l.createdAt.toLocaleString()}
                      </li>
                      <li>
                        <span className="text-slate-600">Edited</span> · {l.updatedAt.toLocaleString()}
                      </li>
                      <li>
                        <span className="text-slate-600">Documents uploaded</span> · {docsUploaded} file
                        {docsUploaded === 1 ? "" : "s"}
                      </li>
                      <li>
                        <span className="text-slate-600">Declaration</span> ·{" "}
                        {l.sellerDeclarationCompletedAt
                          ? l.sellerDeclarationCompletedAt.toLocaleString()
                          : "Not completed"}
                      </li>
                      <li>
                        <span className="text-slate-600">Published</span> ·{" "}
                        {l.status === "ACTIVE"
                          ? l.paidPublishAt
                            ? l.paidPublishAt.toLocaleString()
                            : "Live (pending payment timestamp)"
                          : "Not published"}
                      </li>
                    </ul>
                    {l.rejectReason && ux === "rejected" ? (
                      <p className="mt-2 text-sm text-red-300/90">Reason: {l.rejectReason}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(ux, l.status)}`}>
                      {badgeLabel(ux, l.status)}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/seller/create-listing?id=${encodeURIComponent(l.id)}`}
                        className="rounded-lg border border-[#C9A646]/40 px-3 py-1.5 text-center text-xs font-semibold text-[#C9A646] hover:bg-[#C9A646]/10"
                      >
                        Continue setup
                      </Link>
                      <Link href="/dashboard/seller/documents" className="text-[11px] text-slate-500 hover:text-slate-300">
                        Documents
                      </Link>
                    </div>
                    <SellerHubListingActions
                      listingId={l.id}
                      canDelete={canOwnerDelete(l.status)}
                      editHref={`/seller/create-listing?id=${encodeURIComponent(l.id)}`}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {listings.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="✨"
              title="No listings yet"
              description="Complete onboarding, then create a listing — we will guide you through photos, declaration, and documents before publish."
            >
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/seller/onboarding"
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-200"
                >
                  Onboarding
                </Link>
                <Link
                  href="/seller/create-listing"
                  className="rounded-xl bg-[#C9A646] px-6 py-3 text-sm font-bold text-[#0B0B0B]"
                >
                  Create listing
                </Link>
              </div>
            </EmptyState>
          </div>
        ) : null}

        <p className="mt-10 text-center text-xs text-slate-600">
          After approval, published listings appear in{" "}
          <Link href="/buy" className="text-[#C9A646] hover:underline">
            buyer search
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
