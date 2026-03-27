import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { BnhubFraudFlagStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FraudRiskBadge } from "@/components/bnhub/quality/BnhubQualityKit";
import { ResolveFlagForm } from "./ResolveFlagForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  const flags = await prisma.bnhubTrustRiskFlag.findMany({
    where: { flagStatus: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <HubLayout title="Risk flags" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-4xl space-y-4 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← Trust hub
        </Link>
        <h1 className="text-xl font-bold">Engine risk flags</h1>
        <p className="text-sm text-zinc-500">
          Evidence JSON is admin-only. Resolve actions are audited server-side.
        </p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {flags.length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">No open flags.</li>
          ) : (
            flags.map((f) => (
              <li key={f.id} className="space-y-2 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <FraudRiskBadge level={f.severity} />
                  <span className="text-zinc-300">{String(f.flagType).replace(/_/g, " ")}</span>
                  <span className="text-xs text-zinc-600">{f.flagStatus}</span>
                  {f.listingId ? (
                    <Link className="text-amber-400" href={`/admin/bnhub/trust/listings/${f.listingId}`}>
                      Listing
                    </Link>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500">{f.summary}</p>
                <pre className="max-h-32 overflow-auto rounded bg-zinc-950 p-2 text-xs text-zinc-500">
                  {JSON.stringify(f.evidenceJson, null, 2)}
                </pre>
                <ResolveFlagForm flagId={f.id} />
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
