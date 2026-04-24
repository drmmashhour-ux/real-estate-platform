import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildAiRecommendationBundle } from "@/modules/ai-assist/ai-recommendations.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AiRecommendationsCenterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/automation/recommendations`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const [investor, broker, adminDaily] = await Promise.all([
    buildAiRecommendationBundle("investor_opportunities", {}),
    buildAiRecommendationBundle("broker_leads", {}),
    buildAiRecommendationBundle("admin_daily_summary", {}),
  ]);

  function section(title: string, bundle: typeof investor) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {!bundle.ok ? (
          <p className="mt-2 text-sm text-red-400">{bundle.error}</p>
        ) : bundle.value.items.length === 0 ? (
          <p className="mt-2 text-sm text-[#737373]">No rows.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bundle.value.items.slice(0, 12).map((it) => (
              <li key={it.id} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-[#B3B3B3]">
                <div className="font-medium text-white">{it.title}</div>
                <div className="mt-1 whitespace-pre-wrap">{it.body}</div>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                  {it.reasonCodes.map((r) => r.code).join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Admin · AI recommendations
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Recommendations center</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
            Bundled v1 assist layers — listing/host bundles are host-scoped in product surfaces; broker bundle here shows
            platform-wide ranking when no broker filter is applied.
          </p>
        </div>
        <Link
          href={`/${locale}/${country}/dashboard/admin/automation`}
          className="text-sm font-medium text-premium-gold hover:underline"
        >
          ← Automation center
        </Link>
      </div>

      {section("Admin daily snapshot", adminDaily)}
      {section("Investor opportunities (DB-backed)", investor)}
      {section("Broker leads — ranked preview", broker)}
    </div>
  );
}
