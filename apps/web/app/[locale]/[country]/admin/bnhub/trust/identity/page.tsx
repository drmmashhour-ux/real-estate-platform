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

  const rows = await prisma.bnhubTrustIdentityVerification.findMany({
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      userId: true,
      userRole: true,
      provider: true,
      verificationStatus: true,
      resultSummary: true,
      updatedAt: true,
    },
  });

  return (
    <HubLayout title="Identity verification" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-4xl space-y-4 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← Trust hub
        </Link>
        <h1 className="text-xl font-bold">Identity verification</h1>
        <p className="text-sm text-zinc-500">
          Provider payloads are stored server-side only; do not paste secrets into tickets.
        </p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm">
          {rows.length === 0 ? (
            <li className="p-4 text-zinc-500">No verification rows yet.</li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="space-y-1 p-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">{r.verificationStatus}</span>
                  <span className="text-zinc-400">{r.provider}</span>
                  <span className="text-zinc-500">{r.userRole}</span>
                </div>
                <p className="text-xs text-zinc-500">user {r.userId}</p>
                <p className="text-zinc-400">{r.resultSummary ?? "—"}</p>
                <p className="text-xs text-zinc-600">{r.updatedAt.toISOString()}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
