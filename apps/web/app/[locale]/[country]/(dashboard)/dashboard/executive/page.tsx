import type { Metadata } from "next";
import { ExecutiveHubClient } from "@/components/executive/executive-hub-client";

export const metadata: Metadata = {
  title: "Executive command · LECIPM",
};

export default async function ExecutiveDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Executive command center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supervised multi-agent orchestration — specialized domains coordinate through policy-bound tasks and approvals.
        </p>
      </div>
      <ExecutiveHubClient basePath={basePath} />
    </div>
  );
}
