import type { PrivateInvestorPacketContext } from "./private-investor-packet-context.service";

export type PrivatePacketSummaryJson = {
  meta: {
    generatedFor: "PRIVATE_PLACEMENT_ONLY";
    versionLabel: string;
    dealId: string;
    investorUserId: string;
    spvId: string | null;
  };
  executiveSummary: {
    propertyOverview: string;
    acquisitionThesis: string;
    targetTicketContext: string;
  };
  underwritingSummary: {
    overallScore: number | null;
    recommendation: string | null;
    majorRisks: string[];
    majorUpsides: string[];
  };
  esgRetrofitSummary: {
    esgScoreNote: string;
    retrofitScenario: string;
    paybackBand: string;
    financingMatch: string;
  };
  riskDisclosureSummary: {
    marketRisk: string;
    financingRisk: string;
    executionRisk: string;
    liquidityRisk: string;
    complianceTimingRisk: string;
  };
  investorEligibilitySection: {
    exemptionPath: string | null;
    requiredRepresentations: string[];
    missingItems: string[];
  };
  nextSteps: {
    review: string;
    signRepresentations: string;
    signSubscription: string;
    commitmentProcess: string;
  };
  disclaimers: PrivateInvestorPacketContext["disclaimers"];
};

function moneyFromCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

/**
 * Deterministic narrative sections — broker must still review before release.
 */
export function generatePrivateInvestorPacketSections(ctx: PrivateInvestorPacketContext): PrivatePacketSummaryJson {
  const title = ctx.listing?.title ?? "Confidential opportunity";
  const ask = ctx.listing ? `${ctx.listing.price.toLocaleString("en-CA")} (listing)` : moneyFromCents(ctx.deal.priceCents);
  const score = ctx.dealScoreSnapshot?.score ?? ctx.deal.dealScore ?? null;
  const rawRec = ctx.dealScoreSnapshot?.recommendation ?? null;
  const rec =
    rawRec == null ? null
    : typeof rawRec === "string" ? rawRec
    : JSON.stringify(rawRec);
  const risks = ctx.dealScoreSnapshot?.risks?.length ? ctx.dealScoreSnapshot.risks : ["See diligence materials."];
  const strengths =
    ctx.dealScoreSnapshot?.strengths?.length ? ctx.dealScoreSnapshot.strengths : ["Subject to confirmatory diligence."];

  const exemption = ctx.spv?.exemptionPath ?? null;
  const metaEx = ctx.deal.executionMetadata;
  const privateEx =
    metaEx && typeof metaEx === "object" && "privateExemptionNote" in (metaEx as object) ?
      String((metaEx as Record<string, unknown>).privateExemptionNote)
    : null;

  return {
    meta: {
      generatedFor: "PRIVATE_PLACEMENT_ONLY",
      versionLabel: "v1-template",
      dealId: ctx.deal.id,
      investorUserId: ctx.investorUserId,
      spvId: ctx.spv?.id ?? null,
    },
    executiveSummary: {
      propertyOverview: `${title}. CRM stage: ${ctx.deal.crmStage ?? "n/a"}. Indicative context: ${ask}.`,
      acquisitionThesis:
        "Private investment thesis is illustrative — depends on final terms, diligence, and regulatory eligibility. Not investment advice.",
      targetTicketContext:
        "Target ticket and allocation are set in subscription documents after broker approval — no commitment arises from this packet alone.",
    },
    underwritingSummary: {
      overallScore: score,
      recommendation: rec,
      majorRisks: risks.slice(0, 8),
      majorUpsides: strengths.slice(0, 8),
    },
    esgRetrofitSummary: {
      esgScoreNote:
        ctx.listing?.esgComposite != null ?
          `Listing ESG composite (internal): ${ctx.listing.esgComposite.toFixed(1)} (methodology varies; not a green label).`
        : "ESG data incomplete — treat as lower confidence.",
      retrofitScenario:
        "Retrofit / capex scenario to be confirmed with property condition reports and quotes (directional only).",
      paybackBand: "Payback band: illustrative only — not a forecast of returns.",
      financingMatch: "Financing posture follows lender term sheets; rates and covenants can change prior to closing.",
    },
    riskDisclosureSummary: {
      marketRisk: "Market, valuation, and rent assumptions may differ materially from outcomes.",
      financingRisk: "Financing may be unavailable on expected terms or timelines.",
      executionRisk: "Closing depends on conditions, third parties, and regulatory steps.",
      liquidityRisk: "Private securities are illiquid; resale restrictions may apply.",
      complianceTimingRisk:
        "AMF / exemption path steps may add time or require additional documentation — counsel should review.",
    },
    investorEligibilitySection: {
      exemptionPath: exemption ?? privateEx,
      requiredRepresentations: [
        "Accredited / eligible investor status under applicable exemptions (as determined by issuer counsel).",
        "Independent decision with capacity to bear loss of capital.",
        "No reliance on guaranteed outcomes.",
      ],
      missingItems: [],
    },
    nextSteps: {
      review: "Investor and counsel review this packet and linked documents.",
      signRepresentations: "Execute investor representations and questionnaire under broker supervision.",
      signSubscription: "Execute subscription agreement only after eligibility confirmed.",
      commitmentProcess: "Capital commitment follows the controlled CRM commitment workflow after packet release.",
    },
    disclaimers: ctx.disclaimers,
  };
}

export function compilePrivateInvestorPacketHtml(summary: PrivatePacketSummaryJson): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Private Investor Packet</title></head><body>
<h1>Private investor packet</h1>
<p><strong>${esc(summary.disclaimers.notPublicOffering)}</strong></p>
<p>${esc(summary.disclaimers.privatePlacementOnly)}</p>
<p>${esc(summary.disclaimers.noGuaranteedReturns)}</p>
<h2>Executive summary</h2>
<p>${esc(summary.executiveSummary.propertyOverview)}</p>
<p>${esc(summary.executiveSummary.acquisitionThesis)}</p>
<p>${esc(summary.executiveSummary.targetTicketContext)}</p>
<h2>Underwriting summary</h2>
<p>Score: ${summary.underwritingSummary.overallScore ?? "—"} · Recommendation: ${esc(summary.underwritingSummary.recommendation ?? "—")}</p>
<h3>Risks</h3>${ul(summary.underwritingSummary.majorRisks)}
<h3>Upsides</h3>${ul(summary.underwritingSummary.majorUpsides)}
<h2>ESG / retrofit</h2>
<p>${esc(summary.esgRetrofitSummary.esgScoreNote)}</p>
<p>${esc(summary.esgRetrofitSummary.retrofitScenario)}</p>
<p>${esc(summary.esgRetrofitSummary.paybackBand)}</p>
<p>${esc(summary.esgRetrofitSummary.financingMatch)}</p>
<h2>Risk disclosure summary</h2>
<ul>
<li>${esc(summary.riskDisclosureSummary.marketRisk)}</li>
<li>${esc(summary.riskDisclosureSummary.financingRisk)}</li>
<li>${esc(summary.riskDisclosureSummary.executionRisk)}</li>
<li>${esc(summary.riskDisclosureSummary.liquidityRisk)}</li>
<li>${esc(summary.riskDisclosureSummary.complianceTimingRisk)}</li>
</ul>
<h2>Eligibility</h2>
<p>Exemption path: ${esc(summary.investorEligibilitySection.exemptionPath ?? "TBD")}</p>
${ul(summary.investorEligibilitySection.requiredRepresentations)}
<h2>Next steps</h2>
<ul>
<li>${esc(summary.nextSteps.review)}</li>
<li>${esc(summary.nextSteps.signRepresentations)}</li>
<li>${esc(summary.nextSteps.signSubscription)}</li>
<li>${esc(summary.nextSteps.commitmentProcess)}</li>
</ul>
</body></html>`;
}
