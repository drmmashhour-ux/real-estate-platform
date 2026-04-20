/**
 * Public read-only investor summary — no mutations, no admin chrome, no internal payloads.
 * Invalid/expired/revoked tokens share one generic UI (no existence leaks).
 */

import type { Metadata } from "next";
import { InvestorSharedDashboardPanel } from "@/components/investors/InvestorSharedDashboardPanel";
import { engineFlags } from "@/config/feature-flags";
import { loadPublicInvestorShareDashboard } from "@/modules/investors/investor-share.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Investor summary",
};

function InvalidShareState() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-zinc-100">Summary unavailable</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
        This link is invalid, expired, or no longer active. Request a new link from your contact if you need access.
      </p>
    </div>
  );
}

function FeatureOffState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm text-zinc-500">This feature is not available.</p>
    </div>
  );
}

export default async function InvestorSharePublicPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  if (!engineFlags.investorSharePublicV1) {
    return <FeatureOffState />;
  }
  const raw = params.token ?? "";
  const token = decodeURIComponent(raw);
  const result = await loadPublicInvestorShareDashboard(token);
  if (!result) {
    return <InvalidShareState />;
  }
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <InvestorSharedDashboardPanel dashboard={result.dashboard} />
    </main>
  );
}
