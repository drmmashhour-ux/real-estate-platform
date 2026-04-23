import type { Metadata } from "next";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { ensureReferralCode, resolveReferralAttribution } from "@/lib/referrals";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { ViralInviteLanding } from "@/components/referral/ViralInviteLanding";
import { InviteFriendsShare } from "@/components/referral/InviteFriendsShare";

export const metadata: Metadata = {
  title: "Invite friends",
  description: `Share ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) with your network. Referral credits when friends join and convert.`,
  openGraph: {
    title: "Invite friends",
    description: "Earn rewards when your referrals join the platform.",
  },
};

export const dynamic = "force-dynamic";

export default async function InvitePage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const incomingRef = params.ref?.trim() || null;
  const attribution = incomingRef ? await resolveReferralAttribution(incomingRef).catch(() => null) : null;

  const id = await getGuestId();
  const user = id
    ? await prisma.user.findUnique({
        where: { id },
        select: { id: true, referralCode: true },
      })
    : null;
  const code =
    user?.id != null
      ? user.referralCode ?? (await ensureReferralCode(user.id).catch(() => null))
      : null;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const viralInviteLink = user?.id ? `${base}/invite?ref=${encodeURIComponent(user.id)}` : null;
  const classicSignupLink = code ? `${base}/auth/signup?ref=${encodeURIComponent(code)}` : null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <ViralInviteLanding rawRef={incomingRef} attributionCode={attribution?.publicCode ?? null} />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-premium-gold">Viral growth loop</p>
        <h1 className="mt-3 text-4xl font-bold">Invite & earn</h1>
        <p className="mt-4 text-white/75">
          Share <code className="rounded bg-white/10 px-1 text-premium-gold">/invite?ref=</code>
          <span className="text-premium-gold">your-user-id</span> or use your referral code on signup. When friends convert
          (paid flows), both sides can earn credit rewards.
        </p>

        {incomingRef && !attribution ? (
          <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
            This invite link doesn&apos;t match an active member. You can still{" "}
            <Link href="/auth/signup" className="font-semibold underline">
              create an account
            </Link>
            .
          </p>
        ) : null}

        {viralInviteLink && classicSignupLink ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-premium-gold/30 bg-[#111] p-6">
              <p className="text-sm font-semibold text-premium-gold">Primary viral link</p>
              <code className="mt-2 block break-all text-sm text-white/90">{viralInviteLink}</code>
              <p className="mt-3 text-xs text-white/50">Best for sharing — attributes invites to your account before signup.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
              <p className="text-sm font-semibold text-white/80">Direct signup (code)</p>
              <code className="mt-2 block break-all text-xs text-white/70">{classicSignupLink}</code>
            </div>
            <InviteFriendsShare inviteUrl={viralInviteLink} />
            <Link
              href="/dashboard/referrals"
              className="inline-block rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-black"
            >
              Open referral dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-6">
            <p className="text-sm text-white/80">Sign in to generate your invite link and track rewards.</p>
            <Link
              href="/auth/login?next=/invite"
              className="mt-4 inline-block rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-black"
            >
              Sign in
            </Link>
            <Link href="/auth/signup" className="ml-3 text-sm text-premium-gold hover:underline">
              Create account
            </Link>
          </div>
        )}

        <ul className="mt-10 space-y-3 text-sm text-white/70">
          <li>✓ We record invite opens and tie signups to your referral.</li>
          <li>✓ Conversion rewards trigger on successful paid flows (Stripe).</li>
          <li>✓ Viral coefficient and funnel stats live in your referrals hub.</li>
        </ul>

        <p className="mt-12 text-center text-xs font-medium tracking-[0.22em] text-emerald-400/90">
          LECIPM VIRAL LOOP ACTIVE
        </p>
      </div>
    </div>
  );
}
