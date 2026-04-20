import type { CertificateOfLocationBlockerImpact } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service";
import type { CertificateOfLocationViewModel } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";
import { brokerAiFlags } from "@/config/feature-flags";
import { CertificateConsistencyWarnings } from "./CertificateConsistencyWarnings";
import { CertificateExplainabilityCard } from "./CertificateExplainabilityCard";
import { CertificateWorkflowActionsCard } from "./CertificateWorkflowActionsCard";
import { CertificateOfLocationChecklistCard } from "./CertificateOfLocationChecklistCard";
import { CertificateOfLocationNextStepsCard } from "./CertificateOfLocationNextStepsCard";
import { CertificateOfLocationStatusCard } from "./CertificateOfLocationStatusCard";
import { CertificateOfLocationWarningsCard } from "./CertificateOfLocationWarningsCard";

export function CertificateOfLocationHelperPanel(props: {
  listingId?: string;
  viewModel: CertificateOfLocationViewModel;
  blockerImpact?: CertificateOfLocationBlockerImpact | null;
}) {
  const v = props.viewModel;
  const bi = props.blockerImpact;
  const v2 = brokerAiFlags.brokerAiCertificateOfLocationV2;

  return (
    <section className="space-y-4">
      <CertificateOfLocationStatusCard viewModel={v} />
      {bi ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Workflow impact (informational): </span>
          {bi.affectsPublish ? "may affect publish readiness tracking · " : ""}
          {bi.affectsOfferReadiness ? "offer-stage review signals · " : ""}
          {bi.affectsBrokerReview ? "broker review suggested · " : ""}
          {!bi.affectsPublish && !bi.affectsOfferReadiness && !bi.affectsBrokerReview ? "No blocker hints from this snapshot." : ""}
        </div>
      ) : null}
      {v2 ? (
        <>
          <CertificateExplainabilityCard reasons={v.explainabilityReasons} contributingSignals={v.contributingSignals} />
          {v.timelineSummary ? (
            <div className="rounded-xl border border-zinc-800 bg-black/40 px-4 py-3 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Timeline signal · </span>
              {v.timelineSummary}
            </div>
          ) : null}
          <CertificateConsistencyWarnings labels={v.consistencyMismatchLabels} />
          <CertificateWorkflowActionsCard listingId={props.listingId ?? ""} workflow={v.workflowActionsAvailable ?? null} />
        </>
      ) : null}
      <CertificateOfLocationWarningsCard blocking={v.blockingIssues} warnings={v.warnings} />
      <CertificateOfLocationChecklistCard viewModel={v} />
      <CertificateOfLocationNextStepsCard steps={v.nextSteps} />
      <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Disclaimer</p>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-zinc-500">
          {v.disclaimer.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
