"use client";

import type { QuebecListingComplianceEvaluationResult } from "@/modules/legal/compliance/quebec-listing-compliance-evaluator.service";
import type { PropertyLegalRiskScore } from "@/modules/legal/scoring/property-legal-risk.types";
import type { LegalTrustRankingImpact } from "@/modules/trust-ranking/legal-trust-ranking.types";
import { PropertyLegalRiskScoreCard } from "./PropertyLegalRiskScoreCard";
import { QuebecComplianceChecklistCard } from "./QuebecComplianceChecklistCard";
import { QuebecComplianceIssuesList } from "./QuebecComplianceIssuesList";
import { LegalTrustRankingImpactCard } from "./LegalTrustRankingImpactCard";

type PropertyCompliancePanelProps = {
  evaluation: QuebecListingComplianceEvaluationResult | null;
  legalRisk: PropertyLegalRiskScore | null;
  rankingImpact: LegalTrustRankingImpact | null;
};

/** Admin-only compact stack — pass server-fetched payloads. */
export function PropertyCompliancePanel({ evaluation, legalRisk, rankingImpact }: PropertyCompliancePanelProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <QuebecComplianceChecklistCard evaluation={evaluation} />
      <PropertyLegalRiskScoreCard score={legalRisk} />
      <LegalTrustRankingImpactCard impact={rankingImpact} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Issues</p>
        <div className="mt-2">
          <QuebecComplianceIssuesList
            blockingIds={evaluation?.blockingIssues ?? []}
            warnings={evaluation?.warnings ?? []}
          />
        </div>
      </div>
    </section>
  );
}
