import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SellerHubContractsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller/contracts");

  const contracts = await prisma.contract.findMany({
    where: { userId, fsboListingId: { not: null } },
    include: { fsboListing: { select: { id: true, title: true } } },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const pending = contracts.filter((c) => c.status !== "signed");

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/seller" className="text-sm text-[#C9A646] hover:underline">
          ← Seller dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Contracts</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pending signatures: <span className="text-amber-200">{pending.length}</span>
        </p>
        <ul className="mt-8 space-y-3">
          {contracts.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm">
              <span className="font-medium text-white">{c.title || c.type}</span>
              {c.fsboListing ? (
                <span className="text-slate-500"> · {c.fsboListing.title}</span>
              ) : null}
              <span className={`ml-2 text-xs ${c.status === "signed" ? "text-emerald-400" : "text-amber-400"}`}>
                {c.status}
              </span>
            </li>
          ))}
        </ul>
        {contracts.length === 0 ? (
          <p className="mt-8 text-slate-500">No marketplace contracts yet — create a listing to generate agreements.</p>
        ) : null}
      </div>
    </main>
  );
}
