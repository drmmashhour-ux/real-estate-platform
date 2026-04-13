import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { SellerDocumentsHub } from "@/components/seller/SellerDocumentsHub";

export const dynamic = "force-dynamic";

export default async function SellerHubDocumentsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller/documents");

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true },
  });

  const slotDocs = await prisma.fsboListingDocument.findMany({
    where: { fsboListing: { ownerId: userId } },
    include: { fsboListing: { select: { id: true, title: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const pendingSlots = slotDocs.filter((d) => d.status === "missing" || !d.fileUrl);

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/seller" className="text-sm text-premium-gold hover:underline">
          ← Seller dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Documents</h1>
        <p className="mt-2 text-sm text-slate-400">
          Required checklist slots pending: <span className="text-amber-200">{pendingSlots.length}</span>
        </p>

        <div className="mt-10">
          <SellerDocumentsHub
            listings={listings.map((l) => ({ id: l.id, title: l.title, status: l.status }))}
          />
        </div>

        <section className="mt-12 border-t border-white/10 pt-10">
          <h2 className="text-lg font-semibold text-white">Mandatory document slots</h2>
          <p className="mt-1 text-sm text-slate-500">Ownership, ID, and optional items from the listing wizard</p>
          <ul className="mt-6 space-y-3">
            {slotDocs.map((d) => (
              <li key={d.id} className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm">
                <span className="font-medium text-white">{d.fsboListing.title}</span>
                <span className="text-slate-500"> · {d.docType}</span>
                <span className={`ml-2 text-xs ${d.fileUrl ? "text-emerald-400" : "text-amber-400"}`}>
                  {d.fileUrl ? "uploaded" : "missing"}
                </span>
              </li>
            ))}
          </ul>
          {slotDocs.length === 0 ? (
            <p className="mt-8 text-slate-500">No checklist slots yet — create a listing first.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
