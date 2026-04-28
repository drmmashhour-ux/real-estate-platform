import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DemoBadge, ProductionLockStrip } from "@/components/demo/DemoBadge";
import { DemoQA } from "@/components/demo/DemoQA";
import { InvestorDemoFlowPanel } from "@/components/demo/InvestorDemoFlowPanel";
import { InvestorDemoMetrics } from "@/components/demo/InvestorDemoMetrics";
import { getDemoQaEnvSnapshot } from "@/lib/demo/demo-qa-env";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

export default async function InvestorDemoPage() {
  const t = await getTranslations("InvestorDemo");
  if (!isInvestorDemoModeActive()) {
    if (process.env.NODE_ENV === "production") {
      notFound();
    }
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm [dir=rtl]:text-right">
        <h1 className="text-2xl font-semibold text-stone-900">SYBNB investor demo (disabled)</h1>
        <p className="text-sm text-stone-600">
          Set <code className="rounded bg-stone-100 px-1">INVESTOR_DEMO_MODE=true</code> (and, on Vercel,{" "}
          <code className="rounded bg-stone-100 px-1">INVESTOR_DEMO_IN_PRODUCTION=true</code> only in controlled
          non-user environments) to show the hub.
        </p>
      </div>
    );
  }

  const qaEnv = getDemoQaEnvSnapshot();

  return (
    <div className="space-y-10">
      <header className="space-y-2 [dir=rtl]:text-right">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">{t("title")}</h1>
        <p className="text-stone-600">
          {t("lead")}
        </p>
        <div className="flex flex-wrap gap-2">
          <DemoBadge variant="demoData">Demo Data</DemoBadge>
          <DemoBadge variant="paymentProtected">Payment Protected</DemoBadge>
          <DemoBadge variant="verifiedHost">Verified Host</DemoBadge>
        </div>
        <ProductionLockStrip />
      </header>

      <DemoQA aiEnhanced={qaEnv.demoQaAiEnabled} />

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">1. {t("s1")}</h2>
        <p className="text-sm text-stone-600">{t("s1b")}</p>
        <div className="flex flex-wrap gap-2">
          <Cta href="/sybnb">{t("ctaApproved")}</Cta>
          <Cta href="/admin/sybnb/reports">{t("ctaPending")}</Cta>
        </div>
      </section>

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">2. {t("s2")}</h2>
        <p className="text-sm text-stone-600">{t("s2b")}</p>
        <DemoBadge variant="verifiedHost">Verified Host</DemoBadge>
        <DemoBadge variant="approvedStay">Approved Stay</DemoBadge>
      </section>

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">3. {t("s3")}</h2>
        <p className="text-sm text-stone-600">{t("s3b")}</p>
        <Cta href="/dashboard/bookings">{t("ctaBookings")}</Cta>
      </section>

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">4. {t("s4")}</h2>
        <p className="text-sm text-stone-600">{t("s4b")}</p>
        <DemoBadge variant="payoutReview">Payout Under Review</DemoBadge>
      </section>

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">5. {t("s5")}</h2>
        <p className="text-sm text-stone-600">{t("s5b")}</p>
        <Cta href="/admin/sybnb/reports">{t("ctaAdmin")}</Cta>
        <Cta href="/admin/demo-sybnb">{t("ctaDemoAdmin")}</Cta>
      </section>

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">6. {t("s6")}</h2>
        <p className="text-sm text-stone-600">{t("s6b")}</p>
      </section>

      <section className="space-y-4 [dir=rtl]:text-right">
        <h2 className="text-lg font-semibold text-stone-900">{t("metricsTitle")}</h2>
        <InvestorDemoMetrics />
      </section>

      <InvestorDemoFlowPanel />
    </div>
  );
}

function Cta({ href, children }: { href: string; children: React.ReactNode }) {
  const slug = href.replace(/\//g, "_").replace(/^_|_$/g, "") || "home";
  return (
    <Link
      href={href as never}
      data-demo-record={`demo_hub_${slug}`}
      className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-100/80 px-4 py-2 text-sm font-medium text-amber-950 hover:border-amber-400"
    >
      {children}
    </Link>
  );
}
