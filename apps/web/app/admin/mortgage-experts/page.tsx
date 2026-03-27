import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { MortgageExpertsAdminClient } from "./mortgage-experts-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminMortgageExpertsPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/mortgage-experts");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  const experts = await prisma.mortgageExpert.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm text-emerald-400 hover:underline">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Mortgage experts</h1>
        <p className="mt-2 text-sm text-slate-400">Activate or deactivate public visibility and lead routing.</p>
        <MortgageExpertsAdminClient initialExperts={experts} />
      </div>
    </main>
  );
}
