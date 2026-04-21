import type { Metadata } from "next";
import { PLATFORM_DEFAULT_DESCRIPTION } from "@/lib/brand/platform";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { RenoclimatAssistantClient } from "@/components/green/RenoclimatAssistantClient";
import { getRenoclimatAssistantState } from "@/modules/green-ai/renoclimat-assistant/renoclimat-progress.service";

export const metadata: Metadata = {
  title: "Rénoclimat assistant",
  description: "Step-by-step orientation for Québec’s retrofit incentive pathway — informational only.",
  openGraph: {
    title: "Rénoclimat assistant",
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

export default async function RenoclimatAssistantPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const { userId } = await requireAuthenticatedUser();
  const initial = await getRenoclimatAssistantState(userId);

  return (
    <main className="dashboard-shell py-10">
      <RenoclimatAssistantClient locale={locale} country={country} initial={initial} />
    </main>
  );
}
