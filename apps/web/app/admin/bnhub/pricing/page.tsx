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

  const profiles = await prisma.bnhubDynamicPricingProfile.findMany({
    orderBy: { computedAt: "desc" },
    take: 40,
    select: {
      listingId: true,
      recommendedPrice: true,
      confidenceScore: true,
      computedAt: true,
      listing: { select: { title: true, city: true } },
    },
  });

  return (
    <HubLayout title="BNHub pricing" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← BNHub
        </Link>
        <h1 className="text-xl font-bold">Dynamic pricing profiles</h1>
        <p className="text-sm text-zinc-500">AI-assisted recommendations — hosts see non-binding guidance unless autopricing is enabled.</p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 text-sm">
          {profiles.map((p) => (
            <li key={p.listingId} className="flex flex-wrap justify-between gap-2 p-3">
              <span>
                {p.listing.title} · {p.listing.city}
                <Link className="ml-2 text-amber-400" href={`/admin/bnhub/pricing/listings/${p.listingId}`}>
                  Detail
                </Link>
              </span>
              <span className="text-zinc-400">
                ${Number(p.recommendedPrice).toFixed(0)} · {p.confidenceScore}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
