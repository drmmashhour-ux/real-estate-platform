import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { persistEsgEvidenceConfidenceRollup } from "@/modules/esg/esg-evidence-confidence-rollup";
import { userCanManageListingListing } from "@/modules/esg/esg.service";
import {
  ESG_ACTION_CENTER_VERSION,
  type InvestorActionCenterAppendix,
  type PotentialUpliftSummary,
  type SerializedEsgAction,
} from "./esg-action.types";
import {
  applyQuickWinCostPenalty,
  buildPriorityContext,
  prioritizeAction,
  type PrioritizedDraft,
} from "./esg-action-prioritizer";
import {
  buildActionGenerationContext,
  generateDraftActions,
} from "./esg-action-generator";
import { estimateRoiForTemplate } from "./esg-action-roi.engine";
import { estimateTimelineBand } from "./esg-action-timeline.engine";

const TAG = "[esg-action-center]";
const TAG_GEN = "[esg-action-generate]";

function effortBand(actionType: string): "LOW" | "MEDIUM" | "HIGH" {
  if (actionType === "QUICK_WIN" || actionType === "DOCUMENTATION") return "LOW";
  if (actionType === "CAPEX") return "HIGH";
  return "MEDIUM";
}

export function serializeEsgActionRow(a: {
  id: string;
  listingId: string;
  title: string;
  description: string;
  category: string;
  actionType: string;
  priority: string;
  status: string;
  reasonCode: string;
  reasonText: string | null;
  estimatedScoreImpact: number | null;
  estimatedCarbonImpact: number | null;
  estimatedConfidenceImpact: number | null;
  estimatedCostBand: string | null;
  estimatedEffortBand: string | null;
  estimatedTimelineBand: string | null;
  paybackBand: string | null;
  ownerType: string | null;
  assigneeUserId: string | null;
  implementationNotes: string | null;
  generatedFromVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): SerializedEsgAction {
  return {
    id: a.id,
    listingId: a.listingId,
    title: a.title,
    description: a.description,
    category: a.category,
    actionType: a.actionType,
    priority: a.priority,
    status: a.status,
    reasonCode: a.reasonCode,
    reasonText: a.reasonText,
    estimatedScoreImpact: a.estimatedScoreImpact,
    estimatedCarbonImpact: a.estimatedCarbonImpact,
    estimatedConfidenceImpact: a.estimatedConfidenceImpact,
    estimatedCostBand: a.estimatedCostBand,
    estimatedEffortBand: a.estimatedEffortBand,
    estimatedTimelineBand: a.estimatedTimelineBand,
    paybackBand: a.paybackBand,
    ownerType: a.ownerType,
    assigneeUserId: a.assigneeUserId,
    implementationNotes: a.implementationNotes,
    generatedFromVersion: a.generatedFromVersion,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  };
}

function buildPotentialUplift(open: SerializedEsgAction[]): PotentialUpliftSummary {
  const top = open.filter((a) => ["CRITICAL", "HIGH"].includes(a.priority)).slice(0, 3);
  const scoreHints = open.map((a) => a.estimatedScoreImpact ?? 0).reduce((s, x) => s + x, 0);
  const confHints = open.map((a) => a.estimatedConfidenceImpact ?? 0).reduce((s, x) => s + x, 0);

  return {
    narrative:
      top.length > 0 ?
        `If the top ${Math.min(3, top.length)} priority action(s) are completed, the asset could move toward stronger investor readiness — expressed as directional bands, not guaranteed scores.`
      : "No open priority actions — maintain evidence freshness.",
    scoreBandHint:
      scoreHints >= 40 ? "Composite could improve into the next grade band if evidence gaps close."
      : "Score uplift may be incremental until metering and disclosure strengthen.",
    confidenceBandHint:
      confHints >= 60 ?
        "Evidence confidence could move from LOW toward MEDIUM/HIGH with documentation actions."
      : "Confidence gains depend on verified uploads and conflict resolution.",
    disclaimer:
      "Estimates are directional and non-binding; engineering and legal diligence still apply.",
  };
}

export async function userCanAccessEsgActionCenter(userId: string, listingId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === PlatformRole.ADMIN) return true;
  return userCanManageListingListing(userId, listingId);
}

export async function generateEsgActionsForListing(listingId: string): Promise<{
  generated: number;
  criticalCount: number;
  actionCount: number;
}> {
  await persistEsgEvidenceConfidenceRollup(listingId, { scheduleRetrofitRefresh: false });
  const ctx = await buildActionGenerationContext(listingId);
  const drafts = generateDraftActions(ctx);
  const priCtx = buildPriorityContext(ctx);

  const withRoi: PrioritizedDraft[] = drafts.map((d) => {
    const roi = estimateRoiForTemplate({
      category: d.category,
      actionType: d.actionType,
      reasonCode: d.reasonCode,
    });
    const prioritized = prioritizeAction(d, roi, priCtx);
    return prioritized;
  });

  const adjusted = applyQuickWinCostPenalty(withRoi);

  let created = 0;
  let criticalCount = 0;

  for (const item of adjusted) {
    const roi = estimateRoiForTemplate({
      category: item.category,
      actionType: item.actionType,
      reasonCode: item.reasonCode,
    });
    const timeline = estimateTimelineBand({
      category: item.category,
      actionType: item.actionType,
      reasonCode: item.reasonCode,
    });

    const dup = await prisma.esgAction.findFirst({
      where: {
        listingId,
        reasonCode: item.reasonCode,
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
      },
      select: { id: true },
    });
    if (dup) continue;

    if (item.actionType === "QUICK_WIN" && roi.estimatedCostBand === "HIGH") {
      continue;
    }

    await prisma.esgAction.create({
      data: {
        listingId,
        title: item.title.slice(0, 256),
        description: item.description,
        category: item.category,
        actionType: item.actionType,
        priority: item.priority,
        status: "OPEN",
        reasonCode: item.reasonCode,
        reasonText: item.reasonText ?? null,
        estimatedScoreImpact: roi.estimatedScoreImpact,
        estimatedCarbonImpact: roi.estimatedCarbonImpact,
        estimatedConfidenceImpact: roi.estimatedConfidenceImpact,
        estimatedCostBand: roi.estimatedCostBand,
        estimatedEffortBand: effortBand(item.actionType),
        estimatedTimelineBand: timeline,
        paybackBand: roi.paybackBand,
        ownerType: item.ownerType,
        ...(item.blockersJson !== undefined ?
          { blockersJson: item.blockersJson as object }
        : {}),
        ...(item.dependenciesJson !== undefined ?
          { dependenciesJson: item.dependenciesJson as object }
        : {}),
        ...(item.evidenceNeededJson !== undefined ?
          { evidenceNeededJson: item.evidenceNeededJson as object }
        : {}),
        generatedFromVersion: ESG_ACTION_CENTER_VERSION,
      },
    });
    created += 1;
  }

  const all = await prisma.esgAction.findMany({
    where: { listingId },
    select: { priority: true },
  });
  const snapRows = await prisma.esgAction.findMany({ where: { listingId } });

  await prisma.esgActionSnapshot.create({
    data: {
      listingId,
      generationVersion: ESG_ACTION_CENTER_VERSION,
      totalActions: snapRows.length,
      criticalCount: snapRows.filter((r) => r.priority === "CRITICAL").length,
      highCount: snapRows.filter((r) => r.priority === "HIGH").length,
      mediumCount: snapRows.filter((r) => r.priority === "MEDIUM").length,
      lowCount: snapRows.filter((r) => r.priority === "LOW").length,
      actionsJson: snapRows.map(serializeEsgActionRow) as object,
    },
  });

  logInfo(`${TAG_GEN} done`, {
    listingId,
    created,
    total: snapRows.length,
    critical: snapRows.filter((r) => r.priority === "CRITICAL").length,
  });
  return {
    generated: created,
    criticalCount: snapRows.filter((r) => r.priority === "CRITICAL").length,
    actionCount: snapRows.length,
  };
}

export async function getEsgActionCenterBundle(listingId: string) {
  const profile = await prisma.esgProfile.findUnique({ where: { listingId } });
  const actions = await prisma.esgAction.findMany({
    where: { listingId },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  const ser = actions.map(serializeEsgActionRow);
  const open = ser.filter((a) => ["OPEN", "IN_PROGRESS", "BLOCKED"].includes(a.status));
  const completed = ser.filter((a) => a.status === "COMPLETED");

  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedOpen = [...open].sort(
    (a, b) =>
      (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 9) -
      (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 9)
  );

  const quickWins = sortedOpen.filter((a) => a.actionType === "QUICK_WIN");
  const strategicActions = sortedOpen.filter((a) =>
    ["STRATEGIC", "CAPEX"].includes(a.actionType)
  );
  const blockers = sortedOpen.filter(
    (a) => a.priority === "CRITICAL" || a.reasonCode.includes("DOC_CONFLICT") || a.reasonCode.includes("REVIEW")
  );

  const acquisitionReadiness =
    !profile ?
      "UNKNOWN"
    : (profile.compositeScore ?? 0) >= 55 &&
        (profile.dataCoveragePercent ?? 0) >= 35 &&
        (profile.evidenceConfidence ?? 0) >= 35 ?
      "PASS_LIKELY"
    : "CONDITIONAL";

  return {
    listingId,
    summary: {
      compositeScore: profile?.compositeScore ?? null,
      grade: profile?.grade ?? null,
      dataCoveragePercent: profile?.dataCoveragePercent ?? null,
      evidenceConfidence: profile?.evidenceConfidence ?? null,
      acquisitionReadinessBand: acquisitionReadiness,
      totalOpenActions: open.length,
    },
    actions: sortedOpen,
    quickWins,
    strategicActions,
    blockers,
    completedActions: completed,
    potentialUplift: buildPotentialUplift(sortedOpen),
  };
}

export async function buildInvestorActionCenterAppendix(listingId: string): Promise<InvestorActionCenterAppendix> {
  const bundle = await getEsgActionCenterBundle(listingId);
  const open = bundle.actions;

  const topActions = open.slice(0, 5).map((a) => ({
    title: a.title,
    priority: a.priority,
    timeline: a.estimatedTimelineBand,
    why: a.reasonText ?? a.description.slice(0, 160),
  }));

  const quickWins = bundle.quickWins.slice(0, 6).map((a) => ({
    title: a.title,
    timeline: a.estimatedTimelineBand,
  }));

  const majorBlockers = bundle.blockers.slice(0, 6).map((a) => ({
    title: a.title,
    priority: a.priority,
  }));

  const strategicCapex = open
    .filter((a) => a.actionType === "CAPEX")
    .slice(0, 5)
    .map((a) => ({ title: a.title, costBand: a.estimatedCostBand }));

  const readiness =
    bundle.summary.acquisitionReadinessBand === "PASS_LIKELY" ?
      "Could maintain PASS_LIKELY readiness if evidence stays current."
    : "Could improve from CONDITIONAL toward PASS_LIKELY if top evidence and disclosure actions are completed — advisory band only.";

  return {
    topActions,
    quickWins,
    majorBlockers,
    strategicCapex,
    estimatedReadinessImprovement: readiness,
  };
}

/** Pre-rendered HTML fragment for investor-style PDFs (no script; conservative copy). */
export function formatActionCenterForInvestorHtml(a: InvestorActionCenterAppendix): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const li = (items: { title: string }[]) => items.map((i) => `<li>${esc(i.title)}</li>`).join("");

  return `
  <section style="margin-top:1.5rem">
    <h3>Recommended next actions (ESG)</h3>
    <p><em>${esc(a.estimatedReadinessImprovement)}</em></p>
    <h4>Top actions</h4>
    <ol>${a.topActions.map((t) => `<li><strong>${esc(t.title)}</strong> — ${esc(t.why)}</li>`).join("")}</ol>
    <h4>Quick wins</h4>
    <ul>${li(a.quickWins)}</ul>
    <h4>Major blockers to resolve</h4>
    <ul>${a.majorBlockers.map((b) => `<li><strong>${esc(b.priority)}</strong> — ${esc(b.title)}</li>`).join("")}</ul>
    <h4>Strategic capex opportunities</h4>
    <ul>${a.strategicCapex.map((c) => `<li>${esc(c.title)} (${esc(c.costBand ?? "cost TBD")})</li>`).join("")}</ul>
  </section>
  `.trim();
}

export { ESG_ACTION_CENTER_VERSION };
