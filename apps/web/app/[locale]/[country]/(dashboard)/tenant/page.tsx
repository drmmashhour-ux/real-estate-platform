import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Tenant",
  description: "Organization and workspace context for your team.",
};

export const dynamic = "force-dynamic";

export default async function TenantOverviewPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/tenant");

  const rows = await prisma.tenantMembership.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: {
      tenant: { select: { id: true, name: true, slug: true, status: true } },
    },
  });

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold">Tenant workspace</h1>
        <p className="mt-2 text-sm text-white/70">
          Workspaces you belong to. Demo data includes two brokerages after running the full demo seed.
        </p>

        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-white/50">
            No active tenant memberships yet. Join an organization from an invite, or run the demo generator to attach
            sample tenants.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"
              >
                <p className="font-medium text-white">{m.tenant.name}</p>
                <p className="mt-1 text-xs text-white/50">
                  Role: {m.role.replace(/_/g, " ")} · {m.tenant.slug} · {m.tenant.status}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-sm">
          <Link href="/tenant/settings" className="text-emerald-400 hover:text-emerald-300">
            Tenant settings →
          </Link>
        </p>
      </div>
    </main>
  );
}
