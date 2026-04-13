import Link from "next/link";
import { Suspense } from "react";
import { AuthAccountValueCallout } from "@/components/auth/AuthAccountValueCallout";
import { SignupExpertClient } from "./signup-expert-client";

export const metadata = {
  title: "Mortgage expert signup",
};

export default function SignupExpertPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-premium-gold">LECIPM</p>
        <h1 className="mt-2 text-2xl font-bold">Mortgage expert signup</h1>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          Start with email and password only. After sign-in you&apos;ll accept partner terms, then complete AMF licence
          and identity verification before going live on the directory.
        </p>
        <AuthAccountValueCallout variant="signup" />
        <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/[0.04]" aria-hidden />}>
          <SignupExpertClient />
        </Suspense>
        <p className="mt-6 text-center text-sm text-[#737373]">
          Already have an account?{" "}
          <Link href="/auth/login?next=/dashboard/expert" className="text-premium-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
