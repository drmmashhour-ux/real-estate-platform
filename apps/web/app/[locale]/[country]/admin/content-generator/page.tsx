import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { hubNavigation } from "@/lib/hub/navigation";
import { ContentGeneratorClient } from "./content-generator-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminContentGeneratorPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/content-generator");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") redirect("/dashboard");

  const role = await getUserRole();

  const listings = await prisma.shortTermListing.findMany({
    take: 400,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      listingStatus: true,
    },
  });

  return (
    <HubLayout
      title="Content generator"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <div>
          <Link href="/admin/content-ops" className="text-xs text-premium-gold hover:underline">
            ← Content ops
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-white">TikTok content generator</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Pick a BNHUB stay — each script follows: hook (~2s) → visual → value (price/features) → CTA (link in bio). Plus captions and hashtags.
            Copy individual scripts or download everything as a text pack.
          </p>
        </div>

        <ContentGeneratorClient listings={listings} />
      </div>
    </HubLayout>
  );
}
