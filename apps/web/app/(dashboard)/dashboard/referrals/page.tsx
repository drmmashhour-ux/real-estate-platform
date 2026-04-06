import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import Link from "next/link";
import { CopyReferralButton } from "./CopyReferralButton";
import { getReferralAnalytics } from "@/lib/referrals/rewards";
import { evaluateReferralRewards } from "@/lib/referrals/rewards";
import { ensureReferralCode } from "@/lib/referrals";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { AnimatedStatCard } from "@/components/ui/AnimatedStatCard";
import { InviteFriendsShare } from "@/components/referral/InviteFriendsShare";

export default async function ReferralsPage() {
  const theme = getHubTheme("investments");
  const userId = (await getGuestId()) ?? "demo-user";
  const user = await prisma.user
    .findFirst({
      where: { id: userId },
      select: { id: true, referralCode: true },
    })
    .catch(() => null);
  const isDemoViewer = userId === "demo-user" || !user?.id;
  const referralCode =
    user?.referralCode ??
    (!isDemoViewer ? await ensureReferralCode(user.id).catch(() => null) : null) ??
    "USER123XYZ";
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const viralLink =
    !isDemoViewer && user?.id ? `${base}/invite?ref=${encodeURIComponent(user.id)}` : `${base}/invite`;
  const classicLink = `${base}/auth/signup?ref=${encodeURIComponent(referralCode)}`;
  const stats = await getReferralAnalytics(user?.id ?? userId).catch(() => ({
    clicks: 0,
    signups: 0,
    activated: 0,
    paid: 0,
    invitesSent: 0,
    conversions: 0,
    viralCoefficient: 0,
    rewards: [] as { rewardType: string; value: string }[],
  }));
  const rewardState = await evaluateReferralRewards(user?.id ?? userId).catch(() => ({
    level: "Starter" as const,
    rewards: [] as { rewardType: string; value: string }[],
  }));

  return (
    <HubLayout title="Referrals" hubKey="referrals" navigation={hubNavigation.referrals} theme={theme}>
      <div className="space-y-6">
        <PremiumCard accent={theme.accent} className="overflow-hidden">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>
                Viral loop
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Invite friends &amp; earn rewards</h2>
              <p className="mt-2 text-sm text-slate-300">
                Share your viral link (tracks invites before signup) or the classic code link.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
              <p className="text-xs font-semibold text-slate-500">Viral link</p>
              <p className="mt-1 break-all font-mono text-xs">{viralLink}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">Signup with code</p>
              <p className="mt-1 break-all font-mono text-xs">{classicLink}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton href="/invite" accent={theme.accent}>
                Open invite page
              </ActionButton>
              <CopyReferralButton value={viralLink} />
            </div>
            <InviteFriendsShare inviteUrl={viralLink} className="border-white/10" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatedStatCard label="Invites sent" value={stats.invitesSent} accent={theme.accent} />
              <AnimatedStatCard label="Clicks" value={stats.clicks} accent={theme.accent} />
              <AnimatedStatCard label="Signups" value={stats.signups} accent={theme.accent} />
              <AnimatedStatCard label="Activated" value={stats.activated} accent={theme.accent} />
              <AnimatedStatCard label="Paid (conversions)" value={stats.paid} accent={theme.accent} />
              <AnimatedStatCard
                label="Viral K (signups ÷ invites)"
                value={Number(stats.viralCoefficient.toFixed(2))}
                accent={theme.accent}
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Current level</p>
              <p className="mt-1 text-2xl font-bold text-white">{rewardState.level}</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                  style={{ width: `${Math.min(100, (stats.paid / 10) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Next milestone: {stats.paid < 5 ? "5 paid users" : stats.paid < 10 ? "10 paid users" : "Top tier reached"}
              </p>
            </div>
            <p className="text-center text-xs font-medium tracking-[0.2em] text-emerald-400/90">LECIPM VIRAL LOOP ACTIVE</p>
          </div>
        </PremiumCard>
        <Link href="/dashboard/referrals/leaderboard" className="text-sm text-slate-400 hover:text-slate-200">
          Leaderboard →
        </Link>
      </div>
    </HubLayout>
  );
}
