import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { AdminRentHubClient } from "./admin-rent-hub-client";

export const dynamic = "force-dynamic";

export default async function AdminRentHubPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/admin/rent");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
        <h1 className="mt-4 text-2xl font-semibold">Rent Hub (long-term)</h1>
        <p className="mt-1 text-slate-400">
          Listings, applications, leases, and rent payments across the platform.
        </p>
        <div className="mt-8">
          <AdminRentHubClient />
        </div>
      </div>
    </main>
  );
}
