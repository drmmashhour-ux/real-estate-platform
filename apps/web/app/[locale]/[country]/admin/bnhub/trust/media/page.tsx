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

  const rows = await prisma.bnhubMediaTrustValidation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: { listing: { select: { title: true } } },
  });

  return (
    <HubLayout title="Media trust" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-4xl space-y-4 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← Trust hub
        </Link>
        <h1 className="text-xl font-bold">Media & exterior signals</h1>
        <p className="text-sm text-zinc-500">
          Scores are heuristics; CV providers can replace internals without changing admin surfaces.
        </p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm">
          {rows.length === 0 ? (
            <li className="p-4 text-zinc-500">No media validation rows.</li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="grid gap-1 p-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <Link className="font-medium text-amber-400" href={`/admin/bnhub/trust/listings/${r.listingId}`}>
                    {r.listing.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    cover {r.coverPhotoScore} · coverage {r.photoCoverageScore} · dup risk {r.duplicateImageRiskScore}
                  </p>
                  <p className="text-xs text-zinc-500">street view: {r.streetviewComparisonStatus}</p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  exterior: {r.exteriorPhotoPresent ? "yes" : "no"}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
