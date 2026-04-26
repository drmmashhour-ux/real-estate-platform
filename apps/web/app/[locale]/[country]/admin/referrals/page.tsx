import Link from "next/link";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { LegalPacketLink } from "@/components/admin/LegalPacketLink";

export default async function AdminReferralsPage() {
  const userId = (await getGuestId()) ?? "demo-user";
  const top = await prisma.referral
    .groupBy({
      by: ["referrerId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    })
    .catch(() => []);
  const referrerIds = top.map((row) => row.referrerId);
  const users = referrerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: referrerIds } },
        select: { id: true, name: true, email: true, referralCode: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));
  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold">Referral case files</h1>
      <p className="mt-2 text-sm text-slate-400">
        Review top referrers, revenue attribution, rewards, and ambassador-linked payout exposure through packet-backed case files.
      </p>
      <div className="mt-4 space-y-3">
        {top.map((row) => {
          const referrer = userMap.get(row.referrerId);
          return (
            <div key={row.referrerId} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p>{row.referrerId === userId ? "Current user" : referrer?.name ?? referrer?.email ?? row.referrerId}</p>
                  <p className="text-sm text-slate-500">{referrer?.email ?? "No email"}</p>
                  <p className="text-slate-400">{row._count.id} referrals</p>
                  <p className="text-xs text-slate-500">Referral code: {referrer?.referralCode ?? "—"}</p>
                </div>
                <LegalPacketLink
                  href={`/admin/referrals/${encodeURIComponent(row.referrerId)}`}
                  className="rounded border border-sky-500/30 px-3 py-1.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/10"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <Link href="/admin/ambassadors" className="text-teal-300 hover:underline">Manage ambassadors →</Link>
      </div>
    </main>
  );
}
