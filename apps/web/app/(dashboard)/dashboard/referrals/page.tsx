import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import Link from "next/link";
import { CopyReferralButton } from "./CopyReferralButton";
import { getReferralAnalytics } from "@/lib/referrals/rewards";
import { evaluateReferralRewards } from "@/lib/referrals/rewards";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { AnimatedStatCard } from "@/components/ui/AnimatedStatCard";

export default async function ReferralsPage() {
  const theme = getHubTheme("investments");
  const userId = (await getGuestId()) ?? "demo-user";
  const user = await prisma.user.findFirst({ where: { id: userId }, select: { id: true, referralCode: true } }).catch(() => null);
  const referralCode = user?.referralCode ?? "USER123XYZ";
  const link = `/signup?ref=${referralCode}`;
  const stats = await getReferralAnalytics(user?.id ?? userId).catch(() => ({ clicks: 0, signups: 0, activated: 0, paid: 0, rewards: [] as { rewardType: string; value: string }[] }));
  const rewardState = await evaluateReferralRewards(user?.id ?? userId).catch(() => ({ level: "Starter", rewards: [] as { rewardType: string; value: string }[] }));

  return (
    <HubLayout title="Referrals" hubKey="referrals" navigation={hubNavigation.referrals} theme={theme}>
      <div className="space-y-6">
        <PremiumCard accent={theme.accent} className="overflow-hidden">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>Growth Engine</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Invite friends & earn rewards</h2>
              <p className="mt-2 text-sm text-slate-300">Copy your referral link and share it anywhere.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
              {link}
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton href={link} accent={theme.accent}>Open referral link</ActionButton>
              <CopyReferralButton value={link} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatedStatCard label="Clicks" value={stats.clicks} accent={theme.accent} />
              <AnimatedStatCard label="Signups" value={stats.signups} accent={theme.accent} />
              <AnimatedStatCard label="Activated" value={stats.activated} accent={theme.accent} />
              <AnimatedStatCard label="Paid" value={stats.paid} accent={theme.accent} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Current level</p>
              <p className="mt-1 text-2xl font-bold text-white">{rewardState.level}</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" style={{ width: `${Math.min(100, (stats.paid / 10) * 100)}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-400">Next milestone: {stats.paid < 5 ? "5 paid users" : stats.paid < 10 ? "10 paid users" : "Top tier reached"}</p>
            </div>
          </div>
        </PremiumCard>
      </div>
    </HubLayout>
  );
}
