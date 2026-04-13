import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RevenueOptimizationAdminClient } from "./revenue-optimization-client";

export const dynamic = "force-dynamic";

export default async function RevenueOptimizationAdminPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/revenue-optimization");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm text-emerald-400 hover:underline">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Revenue optimization</h1>
        <p className="mt-2 text-sm text-slate-400">
          Mortgage scoring, credit costs, A/B variants, cities, and expert monetization (30d).
        </p>
        <RevenueOptimizationAdminClient />
      </div>
    </main>
  );
}
