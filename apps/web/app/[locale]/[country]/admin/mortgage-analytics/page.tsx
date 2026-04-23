import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { MortgageAnalyticsAdminClient } from "./mortgage-analytics-client";

export const dynamic = "force-dynamic";

export default async function AdminMortgageAnalyticsPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/mortgage-analytics");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm text-emerald-400 hover:underline">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Mortgage marketplace analytics</h1>
        <p className="mt-2 text-sm text-slate-400">Leads, conversion, revenue, and expert ranking snapshot.</p>
        <MortgageAnalyticsAdminClient />
      </div>
    </main>
  );
}
