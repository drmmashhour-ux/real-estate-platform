import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { LegalRiskAnalyzer } from "@/modules/legal/components/LegalRiskAnalyzer";
import { LegalProfileCard } from "@/modules/legal/components/LegalProfileCard";

export const dynamic = "force-dynamic";

export default async function BrokerLegalWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/${locale}/${country}/auth/login?next=/${locale}/${country}/broker/legal`);

  const role = await getUserRole();
  if (role !== "BROKER") redirect(`/${locale}/${country}/dashboard`);

  const theme = getHubTheme("broker");

  return (
    <HubLayout title="Broker" hubKey="broker" navigation={hubNavigation.broker}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Legal &amp; compliance
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Broker protection posture, verification discipline, and deterministic risk summaries — not legal advice.
          </p>
        </div>
        <section className="rounded-2xl border border-premium-gold/25 bg-black/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Protection status</p>
          <p className="mt-2 text-sm text-slate-300">
            Maintain disclosure of information sources, document verification attempts, and buyer warnings to support a
            defensible diligence record.
          </p>
          <Link href="/legal" className="mt-3 inline-block text-sm font-medium text-premium-gold hover:underline">
            Open annotated case library →
          </Link>
        </section>
        <LegalRiskAnalyzer />
        <LegalProfileCard title="Seller disclosure aggregate (your account)" profile={null} />
      </div>
    </HubLayout>
  );
}
