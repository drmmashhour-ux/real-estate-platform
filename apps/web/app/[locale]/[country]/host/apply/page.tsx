import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HostApplyForm } from "./HostApplyForm";

export const dynamic = "force-dynamic";

export default async function HostApplyPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, role: true, accountStatus: true },
  });
  const pendingApp = await prisma.hostApplication.findFirst({
    where: { userId, status: "pending" },
  });
  const approved = user?.role === "HOST" && user?.accountStatus === "ACTIVE";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/bnhub" className="text-sm text-red-400 hover:text-red-300">
          ← BNHUB
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Become a host (BNHUB)</h1>
        <p className="mt-2 text-slate-400">
          Verify your identity and accept hosting terms to list properties. Access is blocked until an admin approves your application.
        </p>

        {approved && (
          <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
            <p className="font-medium text-emerald-200">You are an approved host.</p>
            <p className="mt-1 text-sm text-slate-400">You can create and manage BNHUB listings.</p>
            <Link href="/bnhub/host/dashboard" className="mt-3 inline-block text-sm font-medium text-red-400 hover:text-red-300">
              Go to host dashboard →
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
          <HostApplyForm
            defaultName={user?.name ?? ""}
            defaultEmail={user?.email ?? ""}
            defaultPhone={user?.phone ?? ""}
          />
        )}
      </div>
    </main>
  );
}
