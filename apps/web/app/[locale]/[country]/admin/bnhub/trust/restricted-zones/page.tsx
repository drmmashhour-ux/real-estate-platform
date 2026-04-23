import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  const zones = await prisma.bnhubRestrictedZone.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <HubLayout title="Restricted zones" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-4xl space-y-4 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← Trust hub
        </Link>
        <h1 className="text-xl font-bold">Restricted zone policies</h1>
        <p className="text-sm text-zinc-500">
          Zones are admin-defined policy only — never inferred from neighborhood stereotypes.
        </p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm">
          {zones.length === 0 ? (
            <li className="p-4 text-zinc-500">No zones configured.</li>
          ) : (
            zones.map((z) => (
              <li key={z.id} className="space-y-1 p-3">
                <div className="flex flex-wrap gap-2">
                  <span className="font-medium text-zinc-200">{z.name}</span>
                  {z.isActive ? (
                    <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">active</span>
                  ) : (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">inactive</span>
                  )}
                  {z.policyAction ? (
                    <span className="text-xs text-amber-200">{z.policyAction}</span>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500">
                  postal {z.postalCode ?? "—"} · region {z.regionCode ?? "—"}
                </p>
                {z.policyNotes ? <p className="text-zinc-400">{z.policyNotes}</p> : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
