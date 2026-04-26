import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const bundles = await prisma.bnhubServiceBundle.findMany({
    include: { items: { include: { service: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <HubLayout title="BNHUB bundles" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/services" className="text-sm text-amber-400">
          ← Services
        </Link>
        <h1 className="text-xl font-bold">Experience bundles</h1>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {bundles.map((b) => (
            <li key={b.id} className="p-4 text-sm">
              <span className="font-medium text-zinc-200">{b.name}</span>{" "}
              <span className="text-zinc-500">({b.bundleCode})</span>
              <p className="text-xs text-zinc-500">{b.items.length} item(s)</p>
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
