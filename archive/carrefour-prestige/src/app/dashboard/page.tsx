import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  const [listingCount, offerCount] = await Promise.all([
    prisma.property.count({ where: { ownerId: user?.id } }),
    prisma.offer.count({ where: { buyerId: user?.id } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-light text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-emerald-200/60">
        {user?.email} · <span className="text-[#d4af37]">{user?.role}</span>
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-900/50 bg-[#0c1a14] p-5">
          <p className="text-xs uppercase tracking-wider text-emerald-200/50">Your listings</p>
          <p className="mt-2 text-3xl font-semibold text-[#d4af37]">{listingCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-900/50 bg-[#0c1a14] p-5">
          <p className="text-xs uppercase tracking-wider text-emerald-200/50">Your offers</p>
          <p className="mt-2 text-3xl font-semibold text-[#d4af37]">{offerCount}</p>
        </div>
      </div>
    </div>
  );
}
