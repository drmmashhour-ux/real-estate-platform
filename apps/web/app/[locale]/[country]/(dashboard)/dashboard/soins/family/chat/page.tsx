import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsChatThreadClient } from "@/components/soins/SoinsChatThreadClient";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";

export const dynamic = "force-dynamic";

export default async function SoinsFamilyChatPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country } = await params;
  const back = `/${locale}/${country}/dashboard/soins/family`;

  const lines = [
    {
      id: "1",
      role: "staff" as const,
      message: "Bonjour — l’équipe est disponible pour vos questions.",
      timeLabel: "08:30",
      align: "left" as const,
    },
    {
      id: "2",
      role: "family" as const,
      message: "Merci pour la mise à jour d’hier.",
      timeLabel: "08:45",
      align: "right" as const,
    },
  ];

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="Messages" backHref={back} />
      <SoinsChatThreadClient lines={lines} />
    </div>
  );
}
