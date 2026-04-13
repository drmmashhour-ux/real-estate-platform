import { prisma } from "@/lib/db";
import Link from "next/link";
import { LegalPacketLink } from "@/components/admin/LegalPacketLink";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { AnimatedStatCard } from "@/components/ui/AnimatedStatCard";

export default async function AdminAmbassadorsPage() {
  const themeAccent = "#C9A96E";
  const ambassadors = await prisma.ambassador.findMany({
    include: { user: { select: { email: true } }, commissions: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => []);
  const totalCommission = ambassadors.reduce((sum, a) => sum + a.commissions.reduce((s, c) => s + c.amount, 0), 0);
  return (
    <main className="p-6 text-white">
      <PremiumCard accent={themeAccent} className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: themeAccent }}>Admin Growth</p>
          <h1 className="mt-2 text-3xl font-bold">Ambassador case files</h1>
          <p className="mt-2 text-slate-300">Inspect commission terms, payout readiness, and packet-based review records for each ambassador.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <AnimatedStatCard label="Ambassadors" value={ambassadors.length} accent={themeAccent} />
          <AnimatedStatCard label="Total commissions" value={`$${totalCommission.toFixed(2)}`} accent={themeAccent} />
          <AnimatedStatCard label="Payout-ready" value="Manual" accent={themeAccent} />
        </div>
        <div className="space-y-3">
          {ambassadors.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div>
                <p className="font-medium text-white">{a.user.email}</p>
                <p className="text-sm text-slate-400">{a.isActive ? "Active" : "Inactive"} · {(a.commission * 100).toFixed(0)}%</p>
                <p className="text-sm text-slate-400">Earnings: ${a.commissions.reduce((s, c) => s + c.amount, 0).toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <LegalPacketLink
                  href={`/admin/ambassadors/${encodeURIComponent(a.id)}`}
                  className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200"
                />
                <ActionButton href="/admin/ambassadors/payouts" accent={themeAccent}>Payouts</ActionButton>
                <Link href="/admin/referrals" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">Referral stats</Link>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
    </main>
  );
}
