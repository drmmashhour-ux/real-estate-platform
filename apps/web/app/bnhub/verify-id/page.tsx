import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard/bnhub/host"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Host dashboard
          </Link>
          <span className="text-sm font-medium text-slate-600">
            ID verification
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Verify your identity
        </h1>
        <p className="mt-2 text-slate-600">
          Required before publishing listings. Upload a government-issued ID and a selfie. We’ll review within 1–2 business days.
        </p>

        {identity?.verificationStatus === "VERIFIED" ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-medium text-emerald-800">Identity verified</p>
            {identity.verifiedAt && (
              <p className="mt-1 text-sm text-emerald-700">
                Verified on{" "}
                {new Date(identity.verifiedAt).toLocaleDateString()}
              </p>
            )}
            <Link
              href="/dashboard/bnhub/host"
              className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Back to host dashboard
            </Link>
          </div>
        ) : identity?.verificationStatus === "REJECTED" ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">Verification rejected</p>
            <p className="mt-1 text-sm text-red-700">
              Contact support if you believe this is an error.
            </p>
          </div>
        ) : (
          <IdVerificationForm />
        )}
      </div>
    </main>
  );
}
