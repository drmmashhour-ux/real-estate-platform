import type { ReactNode } from "react";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_OPERATOR } from "@/lib/brand/platform";
import { brokerAiFlags, legalHubFlags } from "@/config/feature-flags";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { LEGAL_PATHS, LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { getGuestId } from "@/lib/auth/session";
import { buildLegalHubContextFromDb } from "@/modules/legal/legal-context.service";
import { buildLegalHubSummary } from "@/modules/legal/legal-state.service";
import { resolveLegalWorkflowsForActor } from "@/modules/legal/legal-workflow-definitions";
import { buildLegalHubViewModel } from "@/modules/legal/legal-view-model.service";
import type { LegalHubContext, LegalWorkflowDefinition } from "@/modules/legal/legal.types";
import { trackLegalHubViewed } from "@/modules/legal/legal-monitoring.service";
import { LegalHubHero } from "@/components/legal/LegalHubHero";
import { LegalPendingActionsCard } from "@/components/legal/LegalPendingActionsCard";
import { LegalWorkflowCard } from "@/components/legal/LegalWorkflowCard";
import { LegalRisksCard } from "@/components/legal/LegalRisksCard";
import { LegalDocumentsCard } from "@/components/legal/LegalDocumentsCard";
import { LegalDisclaimerCard } from "@/components/legal/LegalDisclaimerCard";
import { LegalHubPhase2Panel } from "@/components/legal/LegalHubPhase2Panel";
import { LegalReadinessScoreCard } from "@/components/legal/LegalReadinessScoreCard";
import { LegalBlockingActionsSection } from "@/components/legal/LegalBlockingActionsSection";
import { TrustGrowthPrompt } from "@/components/growth/TrustGrowthPrompt";
import type { LegalHubSummary } from "@/modules/legal/legal.types";
import { CertificateOfLocationHelperPanel } from "@/components/broker-ai/CertificateOfLocationHelperPanel";
import { assertCertificateOfLocationListingAccess } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-access.service";
import { getCertificateOfLocationBlockerImpact } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service";
import { loadCertificateOfLocationPresentation } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";

export const metadata = {
  title: "Legal center",
  description: `Legal center, compliance workspace, terms, privacy — ${PLATFORM_CARREFOUR_NAME} (${PLATFORM_OPERATOR}).`,
};

const STATIC_LINKS: { href: string; label: string; detail: string }[] = [
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.TERMS], label: "Terms of Service", detail: "Platform rules, commissions, liability, Québec law." },
  {
    href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.PLATFORM_ACKNOWLEDGMENT],
    label: "Platform acknowledgment",
    detail: "Facilitator role, licensing, disclosures, AI & calculator disclaimers.",
  },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.PRIVACY], label: "Privacy Policy", detail: "Data collection, use, Stripe payments, and rights." },
  { href: "/legal/copyright", label: "Copyright & ownership", detail: "IP, branding, software, and database rights." },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.COOKIES], label: "Cookie Policy", detail: "Cookies and similar technologies." },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.PLATFORM_USAGE], label: "Platform usage", detail: "Additional hub and conduct rules." },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.BROKER_AGREEMENT], label: "Broker agreement", detail: "Professional and brokerage terms." },
  { href: "/legal/hosting-terms", label: "Hosting terms", detail: "BNHUB / short-term listings." },
  {
    href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.BNHUB_LONG_TERM_RENTAL_AGREEMENT],
    label: "BNHUB long-term rental",
    detail: "Landlord and tenant terms for monthly leases.",
  },
  {
    href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.BNHUB_BROKER_COLLABORATION_AGREEMENT],
    label: "BNHUB broker collaboration",
    detail: "Lead referral, commission splits, and broker obligations.",
  },
  { href: "/legal/developer-terms", label: "Developer terms", detail: "Projects and developer hub." },
];

export default async function LegalCenterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<{ actor?: string; listingId?: string }>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const hubEnabled = legalHubFlags.legalHubV1;

  const userId = await getGuestId().catch(() => null);

  let certificatePanel: ReactNode = null;
  const certListingId = typeof sp.listingId === "string" ? sp.listingId.trim() : "";
  if (brokerAiFlags.brokerAiCertificateOfLocationV1 && certListingId && userId) {
    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const access = await assertCertificateOfLocationListingAccess({
      userId,
      role: viewer?.role ?? null,
      listingId: certListingId,
    });
    if (access.ok) {
      const payload = await loadCertificateOfLocationPresentation({
        listingId: access.listingId,
        brokerFlow: (sp.actor ?? "").toLowerCase() === "broker",
      });
      certificatePanel = (
        <section className="rounded-2xl border border-premium-gold/25 bg-black/35 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">
            Listing certificate of location ({certListingId})
          </p>
          <div className="mt-4">
            <CertificateOfLocationHelperPanel
              listingId={certListingId}
              viewModel={payload.viewModel}
              blockerImpact={getCertificateOfLocationBlockerImpact(payload.summary)}
            />
          </div>
          <p className="mt-4 text-[11px] text-[#71717A]">
            Add <code className="text-premium-gold/90">listingId</code> to this URL to surface a Sell Hub FSBO listing.
          </p>
        </section>
      );
    }
  }

  let viewModel = null as ReturnType<typeof buildLegalHubViewModel> | null;
  let hubCtx: LegalHubContext | null = null;
  let legalHubSummary: LegalHubSummary | null = null;
  let phase2Workflows: LegalWorkflowDefinition[] = [];

  if (hubEnabled) {
    const ctx = await buildLegalHubContextFromDb({
      userId,
      locale,
      country,
      actorHint: sp.actor ?? null,
      jurisdictionHint: country.toLowerCase() === "ca" ? "QC" : null,
    });
    hubCtx = ctx;
    const summary = buildLegalHubSummary(ctx);
    legalHubSummary = summary;
    phase2Workflows = resolveLegalWorkflowsForActor(ctx.actorType);
    viewModel = buildLegalHubViewModel({
      summary,
      actor: ctx.actorType,
      locale,
      flags: ctx.flags,
    });

    trackLegalHubViewed({
      actorType: ctx.actorType,
      locale,
      country,
      countsSummary: {
        workflows: summary.portfolio.totalWorkflows,
        pending: summary.portfolio.pendingWorkflows,
      },
    });
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        {!hubEnabled ? (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-premium-gold">Legal</p>
              <h1 className="mt-3 text-3xl font-bold">Legal center</h1>
              <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
                Transparent terms for{" "}
                <strong className="text-premium-gold">{PLATFORM_CARREFOUR_NAME}</strong> ({PLATFORM_OPERATOR}),
                Québec. Documents may be updated; the effective version is the one published here (or as linked from
                checkout and onboarding).
              </p>
            </div>
            <ul className="space-y-3">
              {STATIC_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-2xl border border-premium-gold/30 bg-[#121212] px-5 py-4 transition-colors hover:border-premium-gold/55 hover:bg-[#1a1a1a]"
                  >
                    <span className="font-semibold text-premium-gold">{item.label}</span>
                    <span className="mt-1 block text-sm text-[#9CA3AF]">{item.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            {viewModel ? (
              <>
                <LegalHubHero hero={viewModel.hero} />
                {certificatePanel}
                {userId ? <TrustGrowthPrompt variant="legal" locale={locale} country={country} /> : null}
                {legalHubFlags.legalReadinessV1 ? (
                  <>
                    <LegalReadinessScoreCard
                      score={viewModel.readinessScore}
                      locale={locale}
                      country={country}
                      criticalRiskCount={viewModel.riskCards.filter((r) => r.severity === "critical").length}
                    />
                    {viewModel.riskCards.some((r) => r.severity === "critical") ? (
                      <div
                        className="rounded-xl border border-red-500/35 bg-red-950/25 px-4 py-3 text-sm text-red-100/95"
                        role="status"
                      >
                        <p className="font-semibold text-red-200">Critical signals present</p>
                        <p className="mt-1 text-xs text-red-100/85">
                          Address the risks listed below before treating workflows as complete — platform guidance only.
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {!userId ? (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
                    Sign in to align workflow status with your account records. You can still read published legal
                    documents below.
                  </p>
                ) : null}
                {viewModel.missingDataWarnings.length > 0 ? (
                  <section
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90"
                    aria-label="Data availability"
                  >
                    <p className="font-semibold text-amber-200/95">Platform record coverage</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-100/80">
                      {viewModel.missingDataWarnings.map((w, i) => (
                        <li key={`${i}-${w.slice(0, 24)}`}>{w}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {legalHubSummary && userId && legalHubFlags.legalEnforcementV1 ? (
                  <LegalBlockingActionsSection
                    summary={legalHubSummary}
                    hubPath={`/${locale}/${country}/legal`}
                  />
                ) : null}
                {viewModel.reviewNotes && viewModel.reviewNotes.length > 0 ? (
                  <section className="rounded-xl border border-premium-gold/25 bg-black/30 px-4 py-3 text-sm text-[#B3B3B3]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Review readiness</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                      {viewModel.reviewNotes.map((n, i) => (
                        <li key={`rn-${i}`}>{n}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                <LegalPendingActionsCard actions={viewModel.pendingActions} />
                {hubCtx &&
                (legalHubFlags.legalUploadV1 || legalHubFlags.legalWorkflowSubmissionV1) ? (
                  <LegalHubPhase2Panel
                    userId={userId}
                    actorType={hubCtx.actorType}
                    showUpload={legalHubFlags.legalUploadV1}
                    showDocuments={legalHubFlags.legalUploadV1}
                    showWorkflowSubmit={legalHubFlags.legalWorkflowSubmissionV1}
                    defaultWorkflowType={phase2Workflows[0]?.workflowType ?? "seller_disclosure"}
                    uploadWorkflows={phase2Workflows}
                  />
                ) : null}
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Workflows</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {viewModel.workflowCards.map((card) => (
                      <LegalWorkflowCard key={card.workflowType} card={card} />
                    ))}
                  </div>
                </section>
                <LegalRisksCard risks={viewModel.riskCards} />
                <LegalDocumentsCard documents={viewModel.documents} />
                <LegalDisclaimerCard
                  paragraphs={viewModel.disclaimerParagraphs}
                  items={viewModel.disclaimerItems}
                />
              </>
            ) : null}

            <section aria-label="Published legal documents" className="border-t border-white/10 pt-10">
              <h2 className="text-sm font-semibold text-white">Published documents</h2>
              <p className="mt-1 text-xs text-[#737373]">Static legal library — separate from your personal workflow status.</p>
              <ul className="mt-6 space-y-3">
                {STATIC_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl border border-premium-gold/20 bg-[#121212] px-5 py-4 transition-colors hover:border-premium-gold/45 hover:bg-[#1a1a1a]"
                    >
                      <span className="font-semibold text-premium-gold">{item.label}</span>
                      <span className="mt-1 block text-sm text-[#9CA3AF]">{item.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <p className="text-xs text-[#737373]">
          French summaries may be available under{" "}
          <Link href="/fr/legal/terms" className="text-premium-gold hover:underline">
            /fr/legal
          </Link>
          . For binding interpretation in case of discrepancy between unofficial translations, the English published
          legal text on this site prevails unless applicable law requires otherwise.
        </p>
        <Link href="/" className="inline-block text-sm font-medium text-premium-gold hover:underline">
          ← Home
        </Link>
      </div>
    </main>
  );
}
