import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { AttributionDashboardClient } from "./attribution-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminAttributionPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/attribution");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Traffic &amp; attribution</h1>
        <p className="mt-2 text-sm text-premium-gold">
          <Link href="/admin/analytics" className="hover:underline">
            Full ads analytics dashboard →
          </Link>
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Landing params: <code className="text-slate-300">?source=facebook</code>,{" "}
          <code className="text-slate-300">?campaign=evaluation_ad</code>,{" "}
          <code className="text-slate-300">?medium=cpc</code> (or standard{" "}
          <code className="text-slate-300">utm_*</code>). First touch is stored in a cookie and copied to
          each new lead. Untagged traffic is recorded as <span className="text-amber-300/90">direct</span>.
        </p>
        <AttributionDashboardClient />
      </div>
    </main>
  );
}
