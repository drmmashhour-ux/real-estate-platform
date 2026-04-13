import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrCreateListingAutopilotSettings } from "@/lib/autopilot/get-autopilot-settings";
import { AutopilotSettingsForm } from "./autopilot-settings-form";

export const dynamic = "force-dynamic";

export default async function DashboardAutopilotPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();

  const base = `/${locale}/${country}`;

  const [settings, listings, pendingSuggestions, recentAppliedFixes, recentAudits] = await Promise.all([
    getOrCreateListingAutopilotSettings(userId),
    prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        listingCode: true,
        city: true,
        listingQualityScore: { select: { qualityScore: true, level: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.listingOptimizationSuggestion.findMany({
      where: {
        listing: { ownerId: userId },
        status: "suggested",
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { listing: { select: { title: true, listingCode: true } } },
    }),
    prisma.listingOptimizationSuggestion.findMany({
      where: {
        listing: { ownerId: userId },
        status: "applied",
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { listing: { select: { title: true, listingCode: true, id: true } } },
    }),
    prisma.listingOptimizationAudit.findMany({
      where: { listing: { ownerId: userId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { listing: { select: { title: true, listingCode: true } } },
    }),
  ]);

  const weak = listings.filter(
    (l) => (l.listingQualityScore?.qualityScore ?? 100) < 58 || !l.listingQualityScore
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`${base}/bnhub/host/dashboard`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Host dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Listing autopilot</h1>
      <p className="mt-1 text-sm text-slate-600">
        Detect weak listings, generate grounded fixes, and apply safe improvements automatically when enabled.
      </p>
      <p className="mt-2 text-sm">
        <Link href={`${base}/dashboard/portfolio-autopilot`} className="font-semibold text-indigo-700 hover:underline">
          Portfolio autopilot
        </Link>{" "}
        — analyze all your stays together, prioritize actions, and trigger safe runs in bulk.
      </p>

      <div className="mt-8 space-y-8">
        <AutopilotSettingsForm
          initial={{
            mode: settings.mode,
            autoFixTitles: settings.autoFixTitles,
            autoFixDescriptions: settings.autoFixDescriptions,
            autoReorderPhotos: settings.autoReorderPhotos,
            autoGenerateContent: settings.autoGenerateContent,
            allowPriceSuggestions: settings.allowPriceSuggestions,
          }}
        />

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Listings needing attention</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {weak.length === 0 ? (
              <li className="text-slate-500">No low-score listings in the top batch — run per-listing optimization as needed.</li>
            ) : (
              weak.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="font-medium text-slate-800">{l.title}</span>
                  <span className="text-slate-500">
                    {l.listingQualityScore ? `${l.listingQualityScore.qualityScore}/100` : "Quality pending"}
                  </span>
                  <Link
                    href={`${base}/dashboard/listings/${l.id}/quality`}
                    className="text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    Open quality & AI
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Pending suggestions</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {pendingSuggestions.length === 0 ? (
              <li>None — run optimization from a listing quality page.</li>
            ) : (
              pendingSuggestions.map((s) => (
                <li key={s.id}>
                  <span className="font-medium text-slate-800">{s.listing.title}</span> · {s.fieldType} ·{" "}
                  {s.riskLevel} risk
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Applied safe fixes (recent)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {recentAppliedFixes.length === 0 ? (
              <li className="text-slate-500">No applied AI fixes yet.</li>
            ) : (
              recentAppliedFixes.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-medium text-slate-800">{s.listing.title}</span> · {s.fieldType}
                  </span>
                  <Link
                    href={`${base}/dashboard/listings/${s.listing.id}/quality`}
                    className="text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    Quality
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Recent audit</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {recentAudits.map((a) => (
              <li key={a.id}>
                <span className="font-mono text-slate-500">{a.createdAt.toISOString().slice(0, 10)}</span> · {a.action}{" "}
                · {a.listing.listingCode}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
