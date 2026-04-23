import { PlatformRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { brokerOpsFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { residentialBrokerFsboWhere } from "@/lib/broker/residential-fsbo-scope";

export const dynamic = "force-dynamic";

export default async function ListingGrowthIndexPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/listings/growth`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.listingMarketingIntelligenceV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Espace inscriptions désactivé.</p>
        <p className="mt-2 text-xs">
          <code className="text-amber-200/90">FEATURE_LISTING_MARKETING_INTELLIGENCE_V1=1</code>
        </p>
      </div>
    );
  }

  const listings = await prisma.fsboListing.findMany({
    where: residentialBrokerFsboWhere(userId),
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: { id: true, title: true, city: true, status: true, listingCode: true, priceCents: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">Inscriptions</p>
        <h1 className="font-serif text-2xl text-amber-50">Croissance par bien</h1>
        <p className="mt-1 text-xs text-zinc-500">Portefeuille résidentiel courtier (FSBO broker).</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-amber-900/35 bg-black/45">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-amber-900/30 bg-black/60 text-[10px] uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Titre</th>
              <th className="px-4 py-2">Ville</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-amber-900/20 hover:bg-amber-500/5">
                <td className="px-4 py-2 font-mono text-xs text-amber-100/90">{l.listingCode ?? "—"}</td>
                <td className="px-4 py-2">{l.title}</td>
                <td className="px-4 py-2">{l.city}</td>
                <td className="px-4 py-2">{l.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    className="text-xs text-amber-200/90 underline"
                    href={`${basePath}/listings/${l.id}/marketing`}
                  >
                    Marketing
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-500">Aucune inscription résidentielle broker pour le moment.</p>
        )}
      </div>
    </div>
  );
}
