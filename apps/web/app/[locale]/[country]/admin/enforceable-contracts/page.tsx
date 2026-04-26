import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { EnforceableContractsAdminClient } from "./EnforceableContractsAdminClient";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminEnforceableContractsPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/enforceable-contracts");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm hover:underline" style={{ color: GOLD }}>
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Enforceable contracts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Signed hub agreements (`enforceable_*`). Audit log is append-only; contract text is stored on the row.
        </p>
        <div className="mt-8">
          <EnforceableContractsAdminClient />
        </div>
      </div>
    </main>
  );
}
