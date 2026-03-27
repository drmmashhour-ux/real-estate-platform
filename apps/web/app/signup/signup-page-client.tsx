"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PLATFORM_NAME, platformBrandGoldTextClass } from "@/lib/brand/platform";
import { SignupAccountClient } from "@/components/auth/SignupAccountClient";
import { track } from "@/lib/tracking";

export function SignupPageClient({ refCode }: { refCode: string }) {
  const referralLink = refCode ? `/auth/signup?ref=${refCode}` : "/auth/signup";
  useEffect(() => {
    track("conversion_track", { meta: { event: "signup_started" } });
  }, []);
  return (
    <main className="mx-auto max-w-2xl p-6 text-white">
      <section className="rounded-2xl border border-[#C9A646]/25 bg-[#0B0B0B] p-6">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${platformBrandGoldTextClass}`}>{PLATFORM_NAME}</p>
        <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
        {refCode ? (
          <p className="mt-3 text-sm text-[#E8C547]">You were invited by a partner.</p>
        ) : (
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Use your email and a password. We&apos;ll email you a confirmation link — then sign in to complete your profile
            and open the dashboard.
          </p>
        )}
        <p className="mt-2 text-xs text-[#737373]">Referral link: {referralLink}</p>

        <SignupAccountClient referralRef={refCode} />

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-[#9CA3AF]">
          Already have an account?{" "}
          <Link href="/auth/login?next=/dashboard" className="font-semibold text-[#C9A646] hover:underline">
            Sign in
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/onboarding"
            onClick={() => track("conversion_track", { meta: { event: "signup_skip_to_onboarding" } })}
            className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:border-[#C9A646]/40"
          >
            Skip to onboarding
          </Link>
          <Link href="/projects" className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:border-[#C9A646]/40">
            Explore projects
          </Link>
        </div>
      </section>
    </main>
  );
}
