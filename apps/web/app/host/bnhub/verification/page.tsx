import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getUserVerificationStatus } from "@/modules/bnhub-trust/services/identityVerificationService";
import { StartVerificationClient } from "./StartVerificationClient";

export const dynamic = "force-dynamic";

export default async function HostBnhubVerificationPage() {
  const userId = await getGuestId();
  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <Link href="/bnhub/login" className="text-emerald-400">
          Sign in
        </Link>
      </main>
    );
  }

  const idv = await getUserVerificationStatus(userId);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-md space-y-6">
        <Link href="/host/bnhub/trust" className="text-sm text-emerald-400">
          ← Trust overview
        </Link>
        <h1 className="text-2xl font-semibold">Identity verification</h1>
        <p className="text-sm text-slate-500">
          Complete verification when prompted. This helps protect payouts and premium host tools.
        </p>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
          <p className="text-slate-400">Current status</p>
          <p className="mt-1 font-medium text-slate-200">{idv?.verificationStatus ?? "NOT_STARTED"}</p>
          {idv?.resultSummary ? <p className="mt-2 text-slate-500">{idv.resultSummary}</p> : null}
        </div>
        <StartVerificationClient />
      </div>
    </main>
  );
}
