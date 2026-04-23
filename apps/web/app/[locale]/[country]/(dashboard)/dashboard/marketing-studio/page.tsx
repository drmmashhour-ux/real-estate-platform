import Link from "next/link";
import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { engineFlags, softLaunchFlags } from "@/config/feature-flags";
import {
  MarketingStudioWorkspace,
  type MarketingListingOption,
} from "@/components/marketing-studio/MarketingStudioWorkspace";

export const dynamic = "force-dynamic";

export default async function MarketingStudioPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const { userId } = await requireAuthenticatedUser();

  const [fsboRows, bnhubHost] = await Promise.all([
    prisma.fsboListing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, city: true },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.bnhubHost.findUnique({
      where: { userId },
      select: {
        listings: {
          select: { id: true, title: true, location: true },
          orderBy: { createdAt: "desc" },
          take: 40,
        },
      },
    }),
  ]);

  const listings: MarketingListingOption[] = [
    ...fsboRows.map((l) => ({
      id: `fsbo:${l.id}`,
      title: l.title || "FSBO listing",
      city: l.city,
    })),
    ...(bnhubHost?.listings ?? []).map((l) => ({
      id: `bnhub:${l.id}`,
      title: l.title || "BNHub stay",
      city: l.location,
    })),
  ];

  const base = `/${locale}/${country}/dashboard`;

  if (!engineFlags.marketingStudioV1) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-white">
        <h1 className="text-2xl font-bold">Marketing Studio</h1>
        <p className="text-sm text-zinc-400">
          The LECIPM Marketing Studio is available when the feature flag is enabled. This keeps production stable until
          you are ready to roll out the visual editor.
        </p>
        <p className="text-sm text-zinc-500">
          Set <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300">FEATURE_MARKETING_STUDIO_V1=true</code> in
          the web app environment, redeploy, and reload this page.
        </p>
        <Link href={base} className="text-sm text-emerald-400 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 text-white md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Marketing Studio</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create real-estate ads with templates, AI copy (deterministic generator), and PNG/JPG export — v1.
          </p>
        </div>
        <Link href={`${base}/marketing`} className="text-sm text-emerald-400 hover:underline">
          Growth marketing copy →
        </Link>
      </div>
      <MarketingStudioWorkspace
        locale={locale}
        country={country}
        listings={listings}
        blogSystemV1={engineFlags.blogSystemV1}
        distributionV1={engineFlags.distributionV1}
        marketingIntelligenceV1={engineFlags.marketingIntelligenceV1}
        softLaunchV1={softLaunchFlags.softLaunchV1}
        adsEngineV1={softLaunchFlags.adsEngineV1}
        firstUsersV1={softLaunchFlags.firstUsersV1}
      />
    </div>
  );
}
