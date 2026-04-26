import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function BrokerResidentialReviewQueuePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/review-queue`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  const deals = await prisma.deal.findMany({ where: { brokerId: userId }, select: { id: true } });
  const ids = deals.map((d) => d.id);
  const [documents, suggestions] =
    ids.length === 0
      ? [[], []]
      : await Promise.all([
          prisma.dealDocument.findMany({
            where: { dealId: { in: ids }, workflowStatus: "broker_review" },
            take: 30,
            orderBy: { createdAt: "desc" },
          }),
          prisma.dealCopilotSuggestion.findMany({
            where: { dealId: { in: ids }, status: "pending" },
            take: 30,
            orderBy: { createdAt: "desc" },
          }),
        ]);

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl text-ds-text">Review queue</h2>
      <section>
        <h3 className="text-sm font-semibold text-ds-text-secondary">Documents</h3>
        <ul className="mt-2 space-y-2">
          {documents.map((d) => (
            <li key={d.id}>
              <Link href={`${base}/deals/${d.dealId}`} className="text-sm text-ds-gold hover:text-amber-200">
                {d.type} — broker review
              </Link>
            </li>
          ))}
        </ul>
        {documents.length === 0 ? <p className="text-sm text-ds-text-secondary">None.</p> : null}
      </section>
      <section>
        <h3 className="text-sm font-semibold text-ds-text-secondary">Copilot suggestions</h3>
        <ul className="mt-2 space-y-2">
          {suggestions.map((s) => (
            <li key={s.id} className="text-sm text-ds-text-secondary">
              <Link href={`${base}/deals/${s.dealId}`} className="text-ds-gold hover:text-amber-200">
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
        {suggestions.length === 0 ? <p className="text-sm text-ds-text-secondary">None pending.</p> : null}
      </section>
    </div>
  );
}
