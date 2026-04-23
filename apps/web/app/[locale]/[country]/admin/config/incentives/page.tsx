import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { IncentivesAdminClient } from "./IncentivesAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminIncentivesConfigPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Incentives &amp; rebate notes</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configurable content blocks for first-time buyer programs, municipal rebates, and Quebec guidance. These are{" "}
          <strong className="text-slate-200">not</strong> eligibility guarantees.
        </p>
        <div className="mt-8">
          <IncentivesAdminClient />
        </div>
      </div>
    </main>
  );
}
