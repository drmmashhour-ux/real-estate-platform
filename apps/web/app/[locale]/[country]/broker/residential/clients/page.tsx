import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialClientsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const dash = `/${locale}/${country}/dashboard/broker/clients`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(dash)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  const clients = await prisma.brokerClient.findMany({
    where: { brokerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: { id: true, fullName: true, email: true, status: true, targetCity: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl text-ds-text">Clients</h2>
      <p className="text-sm text-ds-text-secondary">
        CRM source of truth remains the{" "}
        <Link href={dash} className="text-ds-gold hover:text-amber-200">
          broker clients
        </Link>{" "}
        area — this view highlights residential follow-up context.
      </p>
      <ul className="space-y-2">
        {clients.map((c) => (
          <li key={c.id} className="rounded-xl border border-ds-border bg-ds-card/60 px-4 py-2 text-sm">
            <span className="font-medium text-ds-text">{c.fullName}</span>{" "}
            <span className="text-ds-text-secondary">{c.status}</span> {c.targetCity ? `· ${c.targetCity}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
