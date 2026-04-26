import { redirect } from "next/navigation";
import Link from "next/link";
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
  const campaigns = await prisma.bnhubGrowthCampaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: { listing: { select: { title: true, city: true, listingCode: true } } },
  });

  return (
    <HubLayout title="Growth campaigns" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4">
        <div className="flex justify-between gap-2">
          <h1 className="text-xl font-bold text-white">Campaigns</h1>
          <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
            ← Dashboard
          </Link>
        </div>
        <p className="text-sm text-zinc-500">
          Create drafts via API or host UI. External channels stay pending until Meta/Google/TikTok/WhatsApp are connected.
        </p>
        <ul className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
          {campaigns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={`/admin/bnhub/growth/campaigns/${c.id}`} className="font-medium text-white hover:text-amber-400">
                  {c.campaignName}
                </Link>
                <p className="text-xs text-zinc-500">
                  {c.listing.title} · {c.status} · {c.autonomyLevel}
                </p>
              </div>
              <span className="text-xs text-zinc-600">{c.promoSlug ? `/bnhub/promo/${c.promoSlug}` : ""}</span>
            </li>
          ))}
        </ul>
      </div>
    </HubLayout>
  );
}
