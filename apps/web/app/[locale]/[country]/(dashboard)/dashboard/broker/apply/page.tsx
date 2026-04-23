import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { BrokerApplyForm } from "./BrokerApplyForm";

export const dynamic = "force-dynamic";

export default async function BrokerApplyPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, role: true, brokerStatus: true },
  });
  const pendingApp = await prisma.brokerApplication.findFirst({
    where: { userId, status: "pending" },
  });
  const approved = user?.brokerStatus === "VERIFIED" || user?.role === "BROKER";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard/broker" className="text-sm text-amber-400 hover:text-amber-300">
          ← Broker hub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Broker certification (OACIQ-style)</h1>
        <p className="mt-2 text-slate-400">
          Apply to become a certified broker. You will need your license number and issuing authority (e.g. OACIQ).
        </p>

        {approved && (
          <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
            <p className="font-medium text-emerald-200">You are a verified broker.</p>
            <p className="mt-1 text-sm text-slate-400">You can represent listings, manage deals, and access CRM leads.</p>
            <Link href="/dashboard/broker/crm" className="mt-3 inline-block text-sm font-medium text-amber-400 hover:text-amber-300">
              Go to CRM →
            </Link>
          </div>
        )}

        {pendingApp && !approved && (
          <div className="mt-6 rounded-lg border border-amber-800 bg-amber-950/40 p-4">
            <p className="font-medium text-amber-200">Application pending</p>
            <p className="mt-1 text-sm text-slate-400">Your application is under review. We will notify you once it is processed.</p>
          </div>
        )}

        {!approved && !pendingApp && (
          <BrokerApplyForm
            defaultName={user?.name ?? ""}
            defaultEmail={user?.email ?? ""}
            defaultPhone={user?.phone ?? ""}
          />
        )}
      </div>
    </main>
  );
}
