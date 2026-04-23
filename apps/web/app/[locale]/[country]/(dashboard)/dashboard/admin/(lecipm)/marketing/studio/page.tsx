import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { canAccessAdminDashboard, resolveSeniorHubAccess } from "@/lib/senior-dashboard/role";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MarketingContentStudioClient } from "@/components/marketing-studio/MarketingContentStudioClient";

export const dynamic = "force-dynamic";

export default async function AdminMarketingContentStudioPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;
  const { userId } = await requireAuthenticatedUser();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) redirect(base);
  const access = await resolveSeniorHubAccess(userId, user.role);
  if (!canAccessAdminDashboard(access)) {
    redirect(base);
  }

  const fullStudio = `${base}/marketing-studio`;
  const marketingHub = `${base}/marketing`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 text-white md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Content + video studio</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Scripts, storyboards, poster export, and asset library. No third-party editor required in v1 — structured
          creation and file export; plug in a renderer later.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
          <Link href={marketingHub} className="text-amber-400 hover:underline">
            ← Marketing hub
          </Link>
        </div>
      </div>
      <MarketingContentStudioClient basePath={base} fullStudioHref={fullStudio} />
    </div>
  );
}
