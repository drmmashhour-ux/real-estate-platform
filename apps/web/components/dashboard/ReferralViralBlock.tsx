import { getReferralAnalytics } from "@/lib/referrals/rewards";
import { ReferralViralCard } from "./ReferralViralCard";

/**
 * Server wrapper: loads referral signup count and builds the same invite URL as `/dashboard/referrals`.
 */
export async function ReferralViralBlock({ userId }: { userId: string }) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const stats = await getReferralAnalytics(userId).catch(() => ({
    signups: 0,
  }));
  const inviteLink = base
    ? `${base}/invite?ref=${encodeURIComponent(userId)}`
    : `/invite?ref=${encodeURIComponent(userId)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-3">
      <ReferralViralCard inviteLink={inviteLink} referralCount={stats.signups} />
    </div>
  );
}
