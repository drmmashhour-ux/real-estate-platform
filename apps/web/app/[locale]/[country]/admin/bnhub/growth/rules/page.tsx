import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const rules = await prisma.bnhubGrowthRule.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <HubLayout title="Growth rules" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white">Automation rules</h1>
        <p className="text-sm text-zinc-500">Rule engine hooks for jobs (listing_approved, daily_scan, …).</p>
        <ul className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 text-sm">
          {rules.length === 0 ? (
            <li className="px-4 py-6 text-zinc-500">No rules yet — create via API POST /api/admin/bnhub-growth/rules</li>
          ) : (
            rules.map((r) => (
              <li key={r.id} className="px-4 py-3 text-zinc-300">
                <span className="font-medium text-white">{r.ruleName}</span> · {r.triggerType} ·{" "}
                {r.isEnabled ? "on" : "off"}
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
