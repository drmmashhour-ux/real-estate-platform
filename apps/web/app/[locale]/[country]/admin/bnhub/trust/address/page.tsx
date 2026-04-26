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

  const rows = await prisma.bnhubAddressVerification.findMany({
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: { listing: { select: { title: true, city: true } } },
  });

  return (
    <HubLayout title="Address validation" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-4xl space-y-4 text-white">
        <Link href="/admin/bnhub/trust" className="text-sm text-amber-400">
          ← Trust hub
        </Link>
        <h1 className="text-xl font-bold">Address validation</h1>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm">
          {rows.length === 0 ? (
            <li className="p-4 text-zinc-500">No address verification rows.</li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">{r.geocodeStatus}</span>
                  <Link className="text-amber-400" href={`/admin/bnhub/trust/listings/${r.listingId}`}>
                    {r.listing.title}
                  </Link>
                  <span className="text-zinc-500">{r.listing.city}</span>
                </div>
                <p className="text-xs text-zinc-500">confidence {r.confidenceScore}</p>
                <p className="line-clamp-2 text-zinc-400">{r.normalizedAddress ?? r.rawAddress}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
