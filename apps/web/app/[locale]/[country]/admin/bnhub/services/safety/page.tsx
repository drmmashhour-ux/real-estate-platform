import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const rules = await prisma.bnhubHospitalitySafetyRule.findMany({ orderBy: { priority: "desc" } });
  return (
    <HubLayout title="BNHUB hospitality safety" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/services" className="text-sm text-amber-400">
          ← Services
        </Link>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {rules.map((r) => (
            <li key={r.id} className="p-3 text-sm">
              <span className="font-medium">{r.ruleName}</span>{" "}
              <span className="text-zinc-500">
                {r.scopeType} {r.isEnabled ? "" : "(off)"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
