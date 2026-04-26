import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { OfficeDashboard } from "@/components/brokerage-office/OfficeDashboard";

export const dynamic = "force-dynamic";

export default async function BrokerOfficeHomePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(basePath)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  return <OfficeDashboard userId={userId} basePath={basePath} />;
}
