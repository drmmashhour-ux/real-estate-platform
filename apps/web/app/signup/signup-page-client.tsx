"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PLATFORM_NAME, platformBrandGoldTextClass } from "@/lib/brand/platform";
import { SignupAccountClient } from "@/components/auth/SignupAccountClient";
import { track } from "@/lib/tracking";
import { VIRAL_REF_COOKIE } from "@/lib/referrals/viral";

function readViralRefCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(VIRAL_REF_COOKIE)}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

export function SignupPageClient({ refCode }: { refCode: string }) {
  const [cookieRef, setCookieRef] = useState("");
  useEffect(() => {
    setCookieRef(readViralRefCookie());
  }, []);
  const effectiveRef = useMemo(() => refCode.trim() || cookieRef.trim(), [refCode, cookieRef]);
  useEffect(() => {
    track("conversion_track", { meta: { event: "signup_started" } });
  }, []);
  return (
    <main className="mx-auto max-w-2xl p-6 text-white">
      <section className="rounded-2xl border border-premium-gold/25 bg-[#0B0B0B] p-6">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${platformBrandGoldTextClass}`}>{PLATFORM_NAME}</p>
        <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
        {effectiveRef ? (
          <p className="mt-3 text-sm text-premium-gold">You were invited by a partner.</p>
        ) : (
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Use your email and a password. We&apos;ll email you a confirmation link — then sign in to complete your profile
            and open the dashboard.
          </p>
        )}
        <SignupAccountClient referralRef={effectiveRef} />

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-[#9CA3AF]">
          Already have an account?{" "}
          <Link href="/auth/login?next=/dashboard" className="font-semibold text-premium-gold hover:underline">
            Sign in
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/onboarding"
            onClick={() => track("conversion_track", { meta: { event: "signup_skip_to_onboarding" } })}
            className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:border-premium-gold/40"
          >
            Skip to onboarding
          </Link>
          <Link href="/projects" className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white hover:border-premium-gold/40">
            Explore projects
          </Link>
        </div>
      </section>
    </main>
  );
}
