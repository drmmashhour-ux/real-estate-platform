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
  const escalated = await prisma.bnhubConciergeSession.findMany({
    where: { sessionStatus: "ESCALATED" },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
  return (
    <HubLayout title="BNHUB concierge" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/services" className="text-sm text-amber-400">
          ← Services
        </Link>
        <h1 className="text-xl font-bold">Escalations</h1>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {escalated.length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">No escalated sessions.</li>
          ) : (
            escalated.map((s) => (
              <li key={s.id} className="p-4 text-sm">
                <span className="font-mono text-xs text-zinc-500">{s.id}</span>
                <p className="text-zinc-300">{s.summary ?? "—"}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
