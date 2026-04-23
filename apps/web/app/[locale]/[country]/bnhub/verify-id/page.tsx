import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { IdVerificationForm } from "./id-verification-form";

export default async function VerifyIdPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/bnhub/login");
  }

  const identity = await prisma.identityVerification.findUnique({
    where: { userId },
    select: { verificationStatus: true, verifiedAt: true },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-neutral-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgb(212 175 55 / 0.35), transparent)",
        }}
        aria-hidden
      />
      <header className="relative z-10 border-b border-premium-gold/20 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/dashboard/bnhub/host"
            className="text-sm font-medium text-premium-gold/85 transition hover:text-premium-gold"
          >
            ← Host dashboard
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-gold/70">
            BNHUB · ID verification
          </span>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/80">Trust &amp; safety</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-premium-gold sm:text-4xl">
          Verify your identity
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-premium-gold/75 sm:text-base">
          Required before publishing listings. Upload a government-issued ID and a selfie. We&apos;ll review within
          1–2 business days.
        </p>

        {identity?.verificationStatus === "VERIFIED" ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5 shadow-lg shadow-black/40 backdrop-blur-sm">
            <p className="font-semibold text-emerald-300">Identity verified</p>
            {identity.verifiedAt && (
              <p className="mt-2 text-sm text-emerald-200/90">
                Verified on {new Date(identity.verifiedAt).toLocaleDateString()}
              </p>
            )}
            <Link
              href="/dashboard/bnhub/host"
              className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-premium-gold hover:underline"
            >
              Back to host dashboard →
            </Link>
          </div>
        ) : identity?.verificationStatus === "REJECTED" ? (
          <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 shadow-lg shadow-black/40 backdrop-blur-sm">
            <p className="font-semibold text-red-200">Verification rejected</p>
            <p className="mt-2 text-sm text-red-200/85">Contact support if you believe this is an error.</p>
          </div>
        ) : (
          <IdVerificationForm />
        )}
      </div>
    </main>
  );
}
