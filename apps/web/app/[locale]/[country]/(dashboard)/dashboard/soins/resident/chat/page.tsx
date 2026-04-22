import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsChatThreadClient } from "@/components/soins/SoinsChatThreadClient";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";

export const dynamic = "force-dynamic";

export default async function SoinsResidentChatPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country } = await params;
  const back = `/${locale}/${country}/dashboard/soins/resident`;

  const lines = [
    {
      id: "1",
      role: "staff" as const,
      message: "Bonjour — voici un espace simple pour échanger avec l’équipe.",
      timeLabel: "09:00",
      align: "left" as const,
    },
    {
      id: "2",
      role: "resident" as const,
      message: "Merci, tout va bien ce matin.",
      timeLabel: "09:04",
      align: "right" as const,
    },
  ];

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="Messages" backHref={back} />
      <SoinsChatThreadClient lines={lines} />
      <p className="mx-auto max-w-2xl px-4 pb-10 text-center text-sm text-white/35">
        Démo UI — branchez l’API `/api/mobile/soins/chat` pour les messages réels.
      </p>
    </div>
  );
}
