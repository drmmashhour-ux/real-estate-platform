import { prisma } from "@/lib/db";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { AnimatedStatCard } from "@/components/ui/AnimatedStatCard";

export default async function AmbassadorPage() {
  const userId = (await getGuestId()) ?? "demo-user";
  const ambassador = await prisma.ambassador.findFirst({
    where: { userId },
    include: { commissions: true, user: { select: { email: true, referralCode: true } } },
  }).catch(() => null);
  const earnings = ambassador?.commissions.reduce((sum, c) => sum + c.amount, 0) ?? 0;

  return (
    <HubLayout title="Ambassador" hubKey="referrals" navigation={hubNavigation.referrals} theme={getHubTheme("investments")}>
      <div className="space-y-6">
        <PremiumCard accent={getHubTheme("investments").accent} className="overflow-hidden">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: getHubTheme("investments").accent }}>Ambassador Console</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Ambassador earnings</h2>
              <p className="mt-2 text-sm text-slate-300">Track your commission rate and total revenue generated.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <AnimatedStatCard label="Commission %" value={`${((ambassador?.commission ?? 0.1) * 100).toFixed(0)}%`} accent={getHubTheme("investments").accent} />
              <AnimatedStatCard label="Total earnings" value={`$${earnings.toFixed(2)}`} accent={getHubTheme("investments").accent} />
              <AnimatedStatCard label="Status" value={ambassador?.isActive ? "Active" : "Inactive"} accent={getHubTheme("investments").accent} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <AnimatedStatCard label="Referred users" value={ambassador?.commissions.length ?? 0} accent={getHubTheme("investments").accent} />
              <AnimatedStatCard label="Revenue generated" value={`$${earnings.toFixed(2)}`} accent={getHubTheme("investments").accent} />
              <AnimatedStatCard label="Top source" value="Subscriptions" accent={getHubTheme("investments").accent} />
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton href="/dashboard/referrals" accent={getHubTheme("investments").accent}>View referrals</ActionButton>
              <ActionButton href="/admin/ambassadors" variant="secondary" accent={getHubTheme("investments").accent}>Request ambassador status</ActionButton>
            </div>
            {!ambassador ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-300">You are not yet an ambassador.</p>
              </div>
            ) : null}
          </div>
        </PremiumCard>
      </div>
    </HubLayout>
  );
}
