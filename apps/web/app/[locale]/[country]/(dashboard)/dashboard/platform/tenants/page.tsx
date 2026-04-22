import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlatformTenantDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const admin = await requireAdminSession();
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  if (!admin.ok) {
    redirect(`${adminBase}`);
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      brand: true,
      _count: {
        select: {
          memberships: true,
          featureFlags: true,
          listings: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen space-y-8 bg-black p-8 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Platform</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">Tenant directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Multi-tenant white-label workspaces — domains, branding, and health at a glance.
        </p>
        <Link href={adminBase} className="mt-4 inline-block text-sm text-[#D4AF37] hover:underline">
          ← Admin home
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Subdomain</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Features</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Brand</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-white/60">{t.tenantType ?? "—"}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3 text-white/60">{t.primaryDomain ?? "—"}</td>
                <td className="px-4 py-3 text-white/60">{t.subdomain ?? "—"}</td>
                <td className="px-4 py-3">{t._count.memberships}</td>
                <td className="px-4 py-3">{t._count.featureFlags}</td>
                <td className="px-4 py-3">{t._count.listings}</td>
                <td className="px-4 py-3 text-white/60">{t.brand?.displayName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
