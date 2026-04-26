import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function BrokerResidentialLeadsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const leadsUrl = `/${locale}/${country}/dashboard/broker/ai-leads`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(leadsUrl)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  const hot = await prisma.brokerClient.findMany({
    where: {
      brokerId: userId,
      status: { in: ["QUALIFIED", "VIEWING", "NEGOTIATING"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: { id: true, fullName: true, status: true, email: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl text-ds-text">Lead priorities</h2>
      <p className="text-sm text-ds-text-secondary">
        For full lead tooling see{" "}
        <Link href={leadsUrl} className="text-ds-gold hover:text-amber-200">
          AI leads
        </Link>
        .
      </p>
      <ul className="space-y-2">
        {hot.map((l) => (
          <li key={l.id} className="rounded-xl border border-ds-border bg-ds-card/60 px-4 py-2 text-sm">
            {l.fullName} — {l.status}
          </li>
        ))}
      </ul>
      {hot.length === 0 ? <p className="text-sm text-ds-text-secondary">No high-intent CRM rows in these stages.</p> : null}
    </div>
  );
}
