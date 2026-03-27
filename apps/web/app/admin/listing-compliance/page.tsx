import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ListingComplianceClient } from "./ListingComplianceClient";

export const dynamic = "force-dynamic";

const GOLD = "#C9A646";

export default async function AdminListingCompliancePage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/listing-compliance");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  const rows = await prisma.listingComplianceReview.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          listingCode: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/admin" className="text-sm hover:underline" style={{ color: GOLD }}>
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Listing compliance</h1>
        <p className="mt-2 text-sm text-slate-400">
          Review queue when <code className="text-slate-300">REQUIRE_COMPLIANCE_ADMIN_APPROVAL</code> is enabled.
          Approve, reject, or request correction before the host can publish.
        </p>
        <ListingComplianceClient initialRows={rows} />
      </div>
    </main>
  );
}
