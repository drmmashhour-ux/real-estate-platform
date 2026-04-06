import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AutoCloseAdminClient } from "@/components/admin/AutoCloseAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminAutoClosePage() {
  const uid = await getGuestId();
  if (!uid) redirect("/auth/login?returnUrl=/admin/autoclose");
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-slate-800 pb-6">
          <Link href="/admin/ai-inbox" className="text-sm text-amber-400 hover:text-amber-300">
            ← AI auto-reply inbox
          </Link>
          <Link href="/admin/crm-live" className="ml-4 text-sm text-amber-400 hover:text-amber-300">
            CRM Live →
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-400/90">Operations</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-white">Safe auto-close</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Low-risk automation only: in-app inactivity nudges (high-intent Growth AI threads), CRM lead reactivation
            flags, and internal booking reminder signals. Blocked: payments, promises, negotiation. Requires{" "}
            <code className="text-slate-400">AI_AUTOCLOSE_ENABLED=1</code> and{" "}
            <code className="text-slate-400">AI_AUTOCLOSE_SAFE_MODE=1</code>.
          </p>
        </header>

        <AutoCloseAdminClient />
      </div>
    </div>
  );
}
