import Link from "next/link";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export default async function AdminReferralsPage() {
  const userId = (await getGuestId()) ?? "demo-user";
  const top = await prisma.referral.groupBy({
    by: ["referrerId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  }).catch(() => []);
  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold">Admin referrals</h1>
      <div className="mt-4 space-y-3">
        {top.map((row) => (
          <div key={row.referrerId} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p>{row.referrerId === userId ? "Current user" : row.referrerId}</p>
            <p className="text-slate-400">{row._count.id} referrals</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link href="/admin/ambassadors" className="text-teal-300 hover:underline">Manage ambassadors →</Link>
      </div>
    </main>
  );
}
