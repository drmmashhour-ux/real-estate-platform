import { prisma } from "@/lib/db";
import { computeEsgScore } from "@/modules/esg/esg-score.engine";
import type { EsgProfilePayload } from "@/modules/esg/esg.types";
import type { EsgActionDraft } from "./esg-action.types";

export type GenerationContext = {
  listingId: string;
  profile: {
    energyScore: number | null;
    carbonScore: number | null;
    sustainabilityScore: number | null;
    certification: string | null;
    solar: boolean;
    renovation: boolean;
    highCarbonMaterials: boolean;
    compositeScore: number | null;
    grade: string | null;
    dataCoveragePercent: number | null;
    evidenceConfidence: number | null;
  } | null;
  engineFlags: string[];
  hasUtilityEvidence: boolean;
  hasCertificationEvidence: boolean;
  hasClimatePlanDoc: boolean;
  hasDecarbDoc: boolean;
  documentReviewQueue: number;
  unverifiedCert: boolean;
  lowConfidenceFlag: boolean;
};

export async function buildActionGenerationContext(listingId: string): Promise<GenerationContext> {
  const profileRow = await prisma.esgProfile.findUnique({ where: { listingId } });

  let engineFlags: string[] = [];
  let compositeScore: number | null = null;
  let grade: string | null = null;

  if (profileRow) {
    const payload = {
      energyScore: profileRow.energyScore,
      carbonScore: profileRow.carbonScore,
      sustainabilityScore: profileRow.sustainabilityScore,
      certification: profileRow.certification,
      solar: profileRow.solar,
      renovation: profileRow.renovation,
      highCarbonMaterials: profileRow.highCarbonMaterials,
    };
    const eng = computeEsgScore(payload);
    engineFlags = eng.flags;
    compositeScore = profileRow.compositeScore ?? eng.score;
    grade = profileRow.grade ?? eng.grade;
  }

  const evidences = await prisma.esgEvidence.findMany({
    where: { listingId },
    select: { fieldKey: true, verification: true },
  });

  const hasUtilityEvidence =
    evidences.some((e) =>
      ["annualEnergyKwh", "annualGasGJ", "annualGasM3"].includes(e.fieldKey) &&
      (e.verification === "VERIFIED" || e.verification === "ESTIMATED")
    ) ?? false;

  const hasCertificationEvidence =
    evidences.some((e) => e.fieldKey.startsWith("certification") && e.verification === "VERIFIED") ?? false;

  const docs = await prisma.esgDocument.findMany({
    where: { listingId },
    select: { documentType: true, processingStatus: true },
  });

  const hasClimatePlanDoc = docs.some((d) =>
    ["CLIMATE_PLAN", "DECARBONIZATION_PLAN"].includes(d.documentType ?? "")
  );
  const hasDecarbDoc =
    docs.some((d) => (d.documentType ?? "").includes("DECARB")) || hasClimatePlanDoc;

  const documentReviewQueue = docs.filter((d) => d.processingStatus === "REVIEW_REQUIRED").length;

  const certClaim = profileRow?.certification?.trim();
  const unverifiedCert =
    Boolean(certClaim && certClaim !== "NONE") && !hasCertificationEvidence;

  const cov = profileRow?.dataCoveragePercent ?? 0;
  const conf = profileRow?.evidenceConfidence ?? 0;
  const lowConfidenceFlag = cov < 35 || conf < 35;

  const profile =
    profileRow ?
      {
        energyScore: profileRow.energyScore,
        carbonScore: profileRow.carbonScore,
        sustainabilityScore: profileRow.sustainabilityScore,
        certification: profileRow.certification,
        solar: profileRow.solar,
        renovation: profileRow.renovation,
        highCarbonMaterials: profileRow.highCarbonMaterials,
        compositeScore,
        grade,
        dataCoveragePercent: profileRow.dataCoveragePercent ?? 0,
        evidenceConfidence: profileRow.evidenceConfidence ?? null,
      }
    : null;

  return {
    listingId,
    profile,
    engineFlags,
    hasUtilityEvidence,
    hasCertificationEvidence,
    hasClimatePlanDoc,
    hasDecarbDoc,
    documentReviewQueue,
    unverifiedCert,
    lowConfidenceFlag,
  };
}

/** Deterministic catalogue — templates keyed by stable reasonCode */
export function generateDraftActions(ctx: GenerationContext): EsgActionDraft[] {
  const out: EsgActionDraft[] = [];
  const p = ctx.profile;

  /** Evidence gaps */
  if (!ctx.hasUtilityEvidence) {
    out.push({
      reasonCode: "EVIDENCE_UTILITY_BILL",
      title: "Upload utility bills for verified energy usage",
      description:
        "Verified electricity and gas/water consumption improves underwriting confidence and reduces inferred gaps.",
      category: "DATA",
      actionType: "DOCUMENTATION",
      reasonText: "No verified utility evidence tied to this asset.",
      ownerType: "BROKER",
      evidenceNeededJson: ["electricity_kwh", "gas_or_fuel"],
    });
  }

  if (ctx.unverifiedCert) {
    out.push({
      reasonCode: "EVIDENCE_CERTIFICATION_PROOF",
      title: "Upload certification proof",
      description:
        "Provide certificate documentation so certification claims align with investor-grade verification.",
      category: "CERTIFICATION",
      actionType: "DOCUMENTATION",
      reasonText: "Certification claimed without verified certificate evidence.",
      ownerType: "SHARED",
      evidenceNeededJson: ["certificate_document"] as unknown as Prisma.JsonValue,
    });
  }

  if (!ctx.hasClimatePlanDoc) {
    out.push({
      reasonCode: "DOC_CLIMATE_RISK_PLAN",
      title: "Add climate-risk / adaptation plan",
      description:
        "Lenders and buyers increasingly expect documented adaptation and hazard awareness for held assets.",
      category: "RESILIENCE",
      actionType: "STRATEGIC",
      reasonText: "No climate / resilience planning document on file.",
      ownerType: "SHARED",
    });
  }

  if (!ctx.hasDecarbDoc && (p?.carbonScore ?? 0) < 60) {
    out.push({
      reasonCode: "DOC_DECARB_ROADMAP",
      title: "Add decarbonization roadmap",
      description:
        "A capex-aligned decarbonization narrative supports financing and investor sequencing discussions.",
      category: "CARBON",
      actionType: "STRATEGIC",
      reasonText: "Carbon profile benefits from a documented reduction pathway.",
      ownerType: "INVESTOR",
    });
  }

  if (ctx.documentReviewQueue > 0) {
    out.push({
      reasonCode: "DOC_REVIEW_QUEUE",
      title: "Resolve document review flags",
      description:
        "Conflicting or low-confidence extractions block stronger verification until reconciled.",
      category: "DATA",
      actionType: "DOCUMENTATION",
      reasonText: `${ctx.documentReviewQueue} document(s) require review.`,
      ownerType: "BROKER",
      blockersJson: ["review_required_documents"] as unknown as Prisma.JsonValue,
    });
  }

  /** Engine flags */
  if (ctx.engineFlags.includes("missing_energy_data")) {
    out.push({
      reasonCode: "DATA_BASELINE_ENERGY",
      title: "Establish baseline energy profile",
      description:
        "Commission benchmarking or compile 12-month utility history before sizing retrofits or solar.",
      category: "ENERGY",
      actionType: "OPERATIONAL",
      reasonText: "Composite score penalized for missing energy inputs.",
      ownerType: "BROKER",
    });
  }

  if (p?.highCarbonMaterials) {
    out.push({
      reasonCode: "CARBON_MATERIALS_PATH",
      title: "Evaluate lower-carbon materials on next capital project",
      description:
        "Shift embodied carbon on renovations / capex through specifications and supplier documentation.",
      category: "CARBON",
      actionType: "STRATEGIC",
      reasonText: "High-carbon materials flag present on profile.",
      ownerType: "INVESTOR",
    });
  }

  if (!p?.renovation) {
    out.push({
      reasonCode: "CARBON_RENOVATION_PRIORITY",
      title: "Prioritize renovation over demolition where feasible",
      description:
        "Reuse and targeted retrofits often beat teardown on embodied carbon for standing assets.",
      category: "CARBON",
      actionType: "STRATEGIC",
      reasonText: "Renovation vs new-build posture not documented as prioritized.",
      ownerType: "SHARED",
    });
  }

  /** Operational / building */
  out.push({
    reasonCode: "ENERGY_AUDIT",
    title: "Commission energy audit",
    description:
      "Independent audit identifies retrofit sequencing and rebate eligibility — directional savings only.",
    category: "ENERGY",
    actionType: "OPERATIONAL",
    reasonText: "Best practice for assets without recent audit narrative.",
    ownerType: "BROKER",
  });

  out.push({
    reasonCode: "ENERGY_HEAT_PUMP",
    title: "Evaluate heat pump retrofit pathway",
    description:
      "Electrification improves carbon trajectory where grids decarbonize; validate with load calcs.",
    category: "ENERGY",
    actionType: "CAPEX",
    reasonText: "Standard capex lever for heating carbon reduction.",
    ownerType: "INVESTOR",
  });

  out.push({
    reasonCode: "HEALTH_VENTILATION",
    title: "Review ventilation / IEQ strategy",
    description:
      "Fresh air rates and filtration impact occupant outcomes and operating loads — document strategy.",
    category: "HEALTH",
    actionType: "OPERATIONAL",
    reasonText: "IEQ diligence gap for investor packs.",
    ownerType: "SHARED",
  });

  /** Finance */
  out.push({
    reasonCode: "FIN_GREEN_FINANCING",
    title: "Prepare green financing package",
    description:
      "Align disclosure, metering, and capex story for lender sustainability screens.",
    category: "FINANCE",
    actionType: "STRATEGIC",
    reasonText: "Optional upside for capital planning.",
    ownerType: "INVESTOR",
    dependenciesJson: ["utility_evidence"] as unknown as Prisma.JsonValue,
  });

  out.push({
    reasonCode: "DISCLOSURE_INVESTOR_PACKET",
    title: "Complete investor-grade ESG disclosure packet",
    description:
      "Consolidate scores, evidence index, and forward plan for diligence — narrative only, not a rating.",
      category: "DISCLOSURE",
      actionType: "DOCUMENTATION",
      reasonText: "Supports acquisition screening readiness.",
      ownerType: "SHARED",
  });

  /** Quick wins — metering */
  out.push({
    reasonCode: "OPS_SMART_METERING",
    title: "Add or normalize smart metering reads",
    description:
      "Interval data improves measurement & verification for efficiency claims.",
    category: "ENERGY",
    actionType: "QUICK_WIN",
    reasonText: "Low-effort telemetry uplift when meters exist.",
    ownerType: "BROKER",
  });

  /** De-dupe identical reason codes (defensive) */
  const seen = new Set<string>();
  return out.filter((a) => {
    if (seen.has(a.reasonCode)) return false;
    seen.add(a.reasonCode);
    return true;
  });
}

/** Build prioritizer context */
export function buildPriorityContext(ctx: GenerationContext): import("./esg-action-prioritizer").PriorityContext {
  return {
    missingEnergyData: ctx.engineFlags.includes("missing_energy_data"),
    lowDataCoverage: (ctx.profile?.dataCoveragePercent ?? 0) < 30,
    lowEvidenceConfidence: (ctx.profile?.evidenceConfidence ?? 0) < 35,
    acquisitionBlockerWeight: Math.min(
      35,
      (ctx.profile?.dataCoveragePercent ?? 0 < 20 ? 12 : 0) +
        ((ctx.profile?.evidenceConfidence ?? 0) < 25 ? 12 : 0) +
        (!ctx.hasUtilityEvidence ? 14 : 0)
    ),
    documentConflictSignals: ctx.documentReviewQueue,
    unverifiedCertClaim: ctx.unverifiedCert,
  };
}
