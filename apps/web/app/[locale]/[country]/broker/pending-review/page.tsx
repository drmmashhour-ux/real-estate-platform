import Link from "next/link";
import { prisma } from "@/lib/db";
import { IDENTITY_LEADS_REQUIRED_WARNING } from "@/modules/mortgage/services/broker-verification";
import { requireBrokerPendingPage } from "@/modules/mortgage/services/require-broker-onboarding";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile under review",
};

export default async function BrokerPendingReviewPage() {
  const { userId } = await requireBrokerPendingPage();

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId },
    select: { verificationStatus: true, identityStatus: true },
  });

  const licensePending = broker?.verificationStatus === "pending";
  const identityPending = broker?.identityStatus === "pending";

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-950/40 text-2xl">
          ⏳
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Profile under review</h1>
        <p className="mt-4 text-slate-300">
          Your profile is under review. You will gain access to the mortgage broker dashboard and leads once approved by
          our team.
        </p>
        {(licensePending || identityPending) && (
          <p className="mt-4 rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
            {identityPending ? (
              <>
                <span className="font-semibold text-amber-50">{IDENTITY_LEADS_REQUIRED_WARNING}</span>
                {licensePending ? (
                  <span className="block pt-2 text-amber-100/90">
                    Your license and professional details are also being reviewed.
                  </span>
                ) : null}
              </>
            ) : (
              <span>Your professional profile and license are being reviewed.</span>
            )}
          </p>
        )}
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
          This platform connects clients with brokers. All professionals must comply with AMF regulations.
        </p>
        <p className="mt-8 text-sm text-slate-500">
          <Link href="/auth/login" className="text-premium-gold hover:underline">
            Sign out and back in
          </Link>{" "}
          after you receive approval — or refresh this page later.
        </p>
      </div>
    </div>
  );
}
