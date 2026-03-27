import type { Metadata } from "next";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: "Invite friends",
  description: `Share ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) with your network. Referral credits and rewards when friends sign up and engage.`,
  openGraph: {
    title: "Invite friends",
    description: "Earn rewards when your referrals join the platform.",
  },
};

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const id = await getGuestId();
  const user = id
    ? await prisma.user.findUnique({
        where: { id },
        select: { referralCode: true },
      })
    : null;
  const code = user?.referralCode ?? null;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const refLink = code ? `${base}/auth/signup?ref=${encodeURIComponent(code)}` : null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C9A646]">Referral growth</p>
        <h1 className="mt-3 text-4xl font-bold">Invite &amp; earn</h1>
        <p className="mt-4 text-white/75">
          Share your personal link. When friends create an account and activate (subscriptions, bookings, or
          other paid flows), you can earn referral rewards per our referral program — including bonus exposure
          and credits where applicable.
        </p>

        {refLink ? (
          <div className="mt-8 rounded-2xl border border-[#C9A646]/30 bg-[#111] p-6">
            <p className="text-sm font-semibold text-[#C9A646]">Your invite link</p>
            <code className="mt-2 block break-all text-sm text-white/90">{refLink}</code>
            <Link
              href="/dashboard/referrals"
              className="mt-4 inline-block rounded-xl bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black"
            >
              Open referral dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-6">
            <p className="text-sm text-white/80">Sign in to generate your referral code and track rewards.</p>
            <Link
              href="/auth/login?next=/invite"
              className="mt-4 inline-block rounded-xl bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black"
            >
              Sign in
            </Link>
            <Link href="/auth/signup" className="ml-3 text-sm text-[#C9A646] hover:underline">
              Create account
            </Link>
          </div>
        )}

        <ul className="mt-10 space-y-3 text-sm text-white/70">
          <li>✓ Friends use your link so attribution is tracked.</li>
          <li>✓ Rewards may include credits or discounts on eligible products.</li>
          <li>✓ Full stats live in the referrals hub after login.</li>
        </ul>
      </div>
    </div>
  );
}
