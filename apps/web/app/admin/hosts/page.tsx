import Link from "next/link";
import { getPendingHosts, getAllHosts } from "@/lib/bnhub/host";
import { AdminHostsClient } from "./admin-hosts-client";

export const dynamic = "force-dynamic";

export default async function AdminHostsPage() {
  const [pendingHosts, allHosts] = await Promise.all([
    getPendingHosts(),
    getAllHosts(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/admin"
          className="text-sm text-amber-400 hover:text-amber-300"
        >
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">BNHub host applications</h1>
        <p className="mt-1 text-slate-400">
          Review and approve or reject host applications. Only approved hosts
          can access the host dashboard and create listings.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">
            Pending ({pendingHosts.length})
          </h2>
          <AdminHostsClient
            pendingHosts={pendingHosts.map((h) => ({
              id: h.id,
              userId: h.userId,
              status: h.status,
              name: h.name ?? h.user?.name ?? "—",
              email: h.email ?? h.user?.email ?? "—",
              phone: h.phone ?? "—",
              propertyType: h.propertyType ?? "—",
              location: h.location ?? "—",
              description: h.description ?? "—",
              createdAt: h.createdAt,
            }))}
            allHosts={allHosts.map((h) => ({
              id: h.id,
              userId: h.userId,
              status: h.status,
              name: h.name ?? h.user?.name ?? "—",
              email: h.email ?? h.user?.email ?? "—",
              createdAt: h.createdAt,
            }))}
          />
        </section>
      </div>
    </main>
  );
}
