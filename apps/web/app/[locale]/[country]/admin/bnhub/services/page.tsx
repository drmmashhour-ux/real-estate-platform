import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import { AdminHospitalityClient } from "./admin-hospitality-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  const services = await prisma.bnhubService.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <HubLayout title="BNHUB services" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-6 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← BNHUB trust
        </Link>
        <div>
          <h1 className="text-xl font-bold">Hospitality add-ons catalog</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Toggle global services, mark premium tiers (blocked on high-risk listings), and restrict abusive per-listing
            offers.
          </p>
        </div>
        <AdminHospitalityClient initialServices={services} />
      </div>
    </HubLayout>
  );
}
