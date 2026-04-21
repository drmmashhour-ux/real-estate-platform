import type { Metadata } from "next";
import { ClosingHubClient } from "@/components/closing-console/closing-hub-client";

export const metadata: Metadata = {
  title: "Closing pipeline · LECIPM",
};

export default async function ClosingDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Closing execution</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure closing room, documents, checklist, signatures, and confirmation — bridge to post-close asset onboarding.
        </p>
      </div>
      <ClosingHubClient localeCountryPrefix={`/${locale}/${country}`} />
    </div>
  );
}
