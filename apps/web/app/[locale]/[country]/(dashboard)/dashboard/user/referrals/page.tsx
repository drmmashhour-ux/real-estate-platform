import { redirect } from "next/navigation";

import { getReferralStatsForUser } from "@/lib/growth/referral";
import { getGuestId } from "@/lib/auth/session";

import { UserReferralsCopyButton } from "./UserReferralsCopyButton";

export const dynamic = "force-dynamic";

export default async function UserReferralsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}`;
  const userId = await getGuestId().catch(() => null);
  if (!userId) {
    redirect(`${basePath}/auth/login?next=${encodeURIComponent(`${basePath}/dashboard/user/referrals`)}`);
  }

  const stats = await getReferralStatsForUser(userId);
  const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const shareLink = `${appBase}${basePath}/auth/signup?ref=${encodeURIComponent(stats.code)}`;

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-10 text-white">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referrals</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Invite friends. Earn rewards. Share your link — when friends sign up with your code, it shows up here.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Successful referrals</p>
        <p className="mt-2 text-4xl font-bold tabular-nums text-white">{stats.totalReferrals}</p>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Your code</p>
        <p className="font-mono text-lg text-amber-100/95">{stats.code}</p>
        <p className="text-xs text-zinc-500 break-all">{shareLink}</p>
        <UserReferralsCopyButton text={shareLink} label="Copy referral link" />
      </section>
    </div>
  );
}
