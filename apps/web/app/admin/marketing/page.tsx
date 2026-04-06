import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { MarketingAiClient } from "./marketing-ai-client";

export const dynamic = "force-dynamic";

export default function AdminMarketingAiPage() {
  return (
    <HubLayout title="AI marketing" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="space-y-6 text-slate-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold/90">BNHub / LECIPM</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">AI marketing drafts</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Generate social copy, captions, emails, and growth ideas. All generation runs on the server; no keys in the
            browser.
          </p>
          <Link href="/admin" className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
        </div>
        <MarketingAiClient />
      </div>
    </HubLayout>
  );
}
