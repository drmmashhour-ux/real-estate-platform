import type { GreenEngineInput } from "@/modules/green/green.types";
import type { SubsidyPipelineResult } from "@/modules/green-ai/pipeline/pipeline.types";
import {
  GREEN_DOCUMENT_DISCLAIMER,
  GREEN_DOCUMENT_MONETIZATION,
  type GreenDocumentKind,
  type PdfReadyOutline,
  type PdfReadySectionBlock,
  type ReportTier,
  type StructuredGreenReport,
} from "./document.types";

function monetizationNote(tier: ReportTier): string {
  return tier === "premium" ? GREEN_DOCUMENT_MONETIZATION.premium : GREEN_DOCUMENT_MONETIZATION.basic;
}

function isoNow(): string {
  return new Date().toISOString();
}

/** Human-readable overview lines from intake + optional labels */
function propertyOverviewParagraphs(args: {
  intake: GreenEngineInput;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): string[] {
  const lines: string[] = [];
  if (args.listingTitle?.trim()) lines.push(`Listing / label: ${args.listingTitle.trim()}`);
  lines.push(`Property archetype: ${args.intake.propertyType ?? "Not specified"}`);
  if (args.intake.yearBuilt != null) lines.push(`Year built (declared): ${args.intake.yearBuilt}`);
  if (args.intake.surfaceSqft != null) lines.push(`Living area (sq ft, declared): ${args.intake.surfaceSqft}`);
  const locale = [args.city, args.region].filter(Boolean).join(", ");
  if (locale) lines.push(`Location context: ${locale}`);
  lines.push(
    "Figures below are modeled from intake — not an appraisal, EnerGuide label, or cadastral certificate.",
  );
  return lines;
}

function esgParagraphs(pipeline: SubsidyPipelineResult, tier: ReportTier): PdfReadySectionBlock[] {
  const ai = pipeline.analysis.ai;
  const qc = pipeline.analysis.quebecEsg;
  const breakdownRows =
    tier === "premium"
      ? Object.entries(qc.breakdown).map(([k, v]) => [k.replace(/_/g, " "), String(v)])
      : Object.entries(qc.breakdown)
          .slice(0, 6)
          .map(([k, v]) => [k.replace(/_/g, " "), String(v)]);

  return [
    {
      id: "esg-score",
      title: "LECIPM modeled score",
      paragraphs: [
        `Adjusted green performance score (Québec-inspired model): ${ai.score}/100.`,
        `Band: ${ai.label}. Verification framing: ${ai.verificationLevel}. Confidence (internal): ${ai.confidence}/100.`,
        qc.quebecDisclaimer,
      ],
    },
    {
      id: "quebec-esg-factors",
      title: "Québec ESG factor breakdown (illustrative)",
      paragraphs: tier === "premium" ? [qc.quebecDisclaimer] : undefined,
      table: {
        headers: ["Factor", "Weight / contribution"],
        rows: breakdownRows,
      },
    },
    {
      id: "issues-recos",
      title: "Signals & recommendations",
      bullets: [...ai.issues.slice(0, tier === "premium" ? 12 : 6), ...ai.recommendations.slice(0, tier === "premium" ? 12 : 6)],
    },
  ];
}

export function buildPropertyEsgReport(args: {
  pipeline: SubsidyPipelineResult;
  intake: GreenEngineInput;
  tier: ReportTier;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): StructuredGreenReport {
  const generatedAtIso = isoNow();
  const pdfReady: PdfReadySectionBlock[] = [
    {
      id: "overview",
      title: "Property context",
      paragraphs: propertyOverviewParagraphs(args),
    },
    ...esgParagraphs(args.pipeline, args.tier),
  ];

  const outline: PdfReadyOutline = {
    title: "Property ESG Report",
    sections: ["Property context", "LECIPM modeled score", "Québec ESG factor breakdown", "Signals & recommendations"],
  };

  return {
    kind: "PROPERTY_ESG_REPORT",
    tier: args.tier,
    title: outline.title,
    disclaimer: GREEN_DOCUMENT_DISCLAIMER,
    monetizationNote: monetizationNote(args.tier),
    generatedAtIso,
    outline,
    pdfReady,
    json: {
      kind: "PROPERTY_ESG_REPORT",
      ai: args.pipeline.analysis.ai,
      quebecEsg: args.pipeline.analysis.quebecEsg,
      intake: args.intake,
    },
  };
}

export function buildGreenEvaluationReport(args: {
  pipeline: SubsidyPipelineResult;
  intake: GreenEngineInput;
  tier: ReportTier;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): StructuredGreenReport {
  const generatedAtIso = isoNow();
  const pdfReady: PdfReadySectionBlock[] = [
    {
      id: "overview",
      title: "Property overview",
      paragraphs: propertyOverviewParagraphs(args),
    },
    {
      id: "scores",
      title: "Evaluation summary",
      paragraphs: [
        `AI-assessed green score: ${args.pipeline.analysis.ai.score}/100 (${args.pipeline.analysis.ai.label}).`,
        `Québec-inspired factor score (same intake): ${args.pipeline.analysis.quebecEsg.score}/100 (${args.pipeline.analysis.quebecEsg.label}).`,
        "Scores are modeled — not an EnerGuide rating, municipal label, or bank appraisal.",
      ],
      bullets: args.pipeline.analysis.ai.recommendations.slice(0, args.tier === "premium" ? 14 : 8),
    },
    {
      id: "renoclimat",
      title: "Rénoclimat-style pathway (screening only)",
      paragraphs: [args.pipeline.renoclimat.headline, args.pipeline.renoclimat.disclaimer],
      bullets: args.pipeline.renoclimat.reasons.slice(0, args.tier === "premium" ? 10 : 6),
    },
  ];

  const outline: PdfReadyOutline = {
    title: "Green Evaluation Report",
    sections: ["Property overview", "Evaluation summary", "Rénoclimat-style pathway"],
  };

  return {
    kind: "GREEN_EVALUATION_REPORT",
    tier: args.tier,
    title: outline.title,
    disclaimer: GREEN_DOCUMENT_DISCLAIMER,
    monetizationNote: monetizationNote(args.tier),
    generatedAtIso,
    outline,
    pdfReady,
    json: {
      kind: "GREEN_EVALUATION_REPORT",
      ai: args.pipeline.analysis.ai,
      renoclimat: args.pipeline.renoclimat,
      intake: args.intake,
    },
  };
}

export function buildUpgradePlanReport(args: {
  pipeline: SubsidyPipelineResult;
  intake: GreenEngineInput;
  tier: ReportTier;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): StructuredGreenReport {
  const generatedAtIso = isoNow();
  const improvements = args.pipeline.analysis.engineImprovements;
  const plan = args.pipeline.upgradePlan;
  const rows = plan.slice(0, args.tier === "premium" ? 24 : 12).map((row) => [
    row.action,
    row.priority,
    row.costEstimate,
    String(row.scoreImpact),
  ]);

  const pdfReady: PdfReadySectionBlock[] = [
    {
      id: "overview",
      title: "Property overview",
      paragraphs: propertyOverviewParagraphs(args),
    },
    {
      id: "engine-improvements",
      title: "Engine recommendations (deterministic)",
      table: {
        headers: ["Measure", "Impact band", "Cost band (illustrative)", "Score delta (modeled)"],
        rows: improvements.slice(0, args.tier === "premium" ? 20 : 10).map((i) => [
          i.action,
          i.impact,
          i.estimatedCostLabel,
          String(i.expectedGainPoints),
        ]),
      },
    },
    {
      id: "staged-plan",
      title: "Staged upgrade plan",
      paragraphs: [
        "Priorities combine engine signals with illustrative grant hooks — confirm contractors and permits independently.",
      ],
      table: {
        headers: ["Action", "Priority", "Cost estimate", "Score impact"],
        rows,
      },
    },
  ];

  const outline: PdfReadyOutline = {
    title: "Upgrade Plan",
    sections: ["Property overview", "Engine recommendations", "Staged upgrade plan"],
  };

  return {
    kind: "UPGRADE_PLAN",
    tier: args.tier,
    title: outline.title,
    disclaimer: GREEN_DOCUMENT_DISCLAIMER,
    monetizationNote: monetizationNote(args.tier),
    generatedAtIso,
    outline,
    pdfReady,
    json: {
      kind: "UPGRADE_PLAN",
      improvements,
      upgradePlan: plan,
      intake: args.intake,
    },
  };
}

export function buildGrantSummaryReport(args: {
  pipeline: SubsidyPipelineResult;
  intake: GreenEngineInput;
  tier: ReportTier;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): StructuredGreenReport {
  const g = args.pipeline.estimatedGrants;
  const grants = args.pipeline.quebecGrants.eligibleGrants;
  const cap = args.tier === "premium" ? grants.length : Math.min(8, grants.length);

  const pdfReady: PdfReadySectionBlock[] = [
    {
      id: "overview",
      title: "Property overview",
      paragraphs: propertyOverviewParagraphs(args),
    },
    {
      id: "illustrative-total",
      title: "Estimated financial support (illustrative)",
      paragraphs: [
        `Sum of illustrative incentive midpoints: $${Math.round(g.estimatedGrant).toLocaleString("en-CA")} CAD.`,
        g.disclaimer,
        args.pipeline.roiContext.note ?? "",
      ].filter(Boolean),
    },
    {
      id: "breakdown",
      title: "Breakdown by modeled category",
      table: {
        headers: ["Category", "Illustrative band"],
        rows: g.breakdown.map((b) => [b.upgrade, b.amount]),
      },
    },
    {
      id: "catalog",
      title: "Québec programme catalogue matches (illustrative)",
      paragraphs: [args.pipeline.quebecGrants.disclaimer],
      table: {
        headers: ["Program / row", "Illustrative amount", "How to apply (summary)"],
        rows: grants.slice(0, cap).map((r) => [r.name, r.amount, r.howToApply.slice(0, 120)]),
      },
    },
    {
      id: "roi",
      title: "Financial context (not investment advice)",
      paragraphs: [
        args.pipeline.roiContext.propertyValueMajor != null
          ? `Declared property value context: $${Math.round(args.pipeline.roiContext.propertyValueMajor).toLocaleString("en-CA")} (major units).`
          : "No declared property value — grant-to-value ratio omitted.",
        args.pipeline.roiContext.note ?? "",
      ].filter(Boolean),
    },
  ];

  const outline: PdfReadyOutline = {
    title: "Grant Summary",
    sections: [
      "Property overview",
      "Estimated financial support",
      "Breakdown by modeled category",
      "Program catalogue matches",
      "Financial context",
    ],
  };

  return {
    kind: "GRANT_SUMMARY",
    tier: args.tier,
    title: outline.title,
    disclaimer: GREEN_DOCUMENT_DISCLAIMER,
    monetizationNote: monetizationNote(args.tier),
    generatedAtIso,
    outline,
    pdfReady,
    json: {
      kind: "GRANT_SUMMARY",
      estimatedGrants: g,
      eligibleGrants: grants,
      roiContext: args.pipeline.roiContext,
      intake: args.intake,
    },
  };
}

/** Combined printable bundle — matches product example sections. */
export function buildCombinedGreenUpgradeReport(args: {
  pipeline: SubsidyPipelineResult;
  intake: GreenEngineInput;
  tier: ReportTier;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): StructuredGreenReport {
  const generatedAtIso = isoNow();
  const ai = args.pipeline.analysis.ai;
  const grants = args.pipeline.estimatedGrants;

  const pdfReady: PdfReadySectionBlock[] = [
    {
      id: "property-overview",
      title: "Property Overview",
      paragraphs: propertyOverviewParagraphs(args),
    },
    {
      id: "esg-score",
      title: "ESG Score",
      paragraphs: [
        `${ai.score}/100 — band ${ai.label}. Québec-inspired factor score ${args.pipeline.analysis.quebecEsg.score}/100 (${args.pipeline.analysis.quebecEsg.label}).`,
        `Verification level (platform): ${ai.verificationLevel}. Confidence: ${ai.confidence}/100.`,
      ],
      bullets: ai.issues.slice(0, args.tier === "premium" ? 10 : 6),
    },
    {
      id: "recommended-improvements",
      title: "Recommended Improvements",
      table: {
        headers: ["Recommendation", "Priority", "Illustrative cost", "Score impact"],
        rows: args.pipeline.upgradePlan.slice(0, args.tier === "premium" ? 18 : 10).map((u) => [
          u.action,
          u.priority,
          u.costEstimate,
          String(u.scoreImpact),
        ]),
      },
    },
    {
      id: "financial-support",
      title: "Estimated Financial Support",
      paragraphs: [
        `Illustrative grant midpoint total: $${Math.round(grants.estimatedGrant).toLocaleString("en-CA")} CAD.`,
        grants.disclaimer,
      ],
      table: {
        headers: ["Measure cluster", "Band"],
        rows: grants.breakdown.map((b) => [b.upgrade, b.amount]),
      },
    },
  ];

  if (args.tier === "premium") {
    pdfReady.push({
      id: "appendix-renoclimat",
      title: "Appendix — pathway screening",
      paragraphs: [args.pipeline.renoclimat.headline, args.pipeline.renoclimat.disclaimer],
      bullets: [...args.pipeline.renoclimat.recommendedActions, ...args.pipeline.renoclimat.reasons].slice(0, 12),
    });
    pdfReady.push({
      id: "appendix-contractors",
      title: "Appendix — contractor matches (illustrative)",
      bullets: args.pipeline.contractors.slice(0, 8).map((c) => `${c.name} — ${c.region}`),
    });
  }

  const outline: PdfReadyOutline = {
    title: "Green Upgrade Report",
    sections: ["Property Overview", "ESG Score", "Recommended Improvements", "Estimated Financial Support"],
  };

  return {
    kind: "GREEN_UPGRADE_REPORT",
    tier: args.tier,
    title: outline.title,
    disclaimer: GREEN_DOCUMENT_DISCLAIMER,
    monetizationNote: monetizationNote(args.tier),
    generatedAtIso,
    outline,
    pdfReady,
    json: {
      kind: "GREEN_UPGRADE_REPORT",
      pipelineSummary: {
        score: ai.score,
        estimatedGrantCad: grants.estimatedGrant,
        grantToPropertyValueRatio: grants.grantToPropertyValueRatio,
      },
      intake: args.intake,
    },
  };
}

export function buildAllStructuredReports(args: {
  pipeline: SubsidyPipelineResult;
  intake: GreenEngineInput;
  tier: ReportTier;
  city?: string | null;
  region?: string | null;
  listingTitle?: string | null;
}): { combined: StructuredGreenReport; documents: StructuredGreenReport[] } {
  const ctx = {
    pipeline: args.pipeline,
    intake: args.intake,
    tier: args.tier,
    city: args.city,
    region: args.region,
    listingTitle: args.listingTitle,
  };

  const combined = buildCombinedGreenUpgradeReport(ctx);

  const documents: StructuredGreenReport[] = [
    buildGreenEvaluationReport(ctx),
    buildUpgradePlanReport(ctx),
    buildGrantSummaryReport(ctx),
    buildPropertyEsgReport(ctx),
  ];

  return { combined, documents };
}
