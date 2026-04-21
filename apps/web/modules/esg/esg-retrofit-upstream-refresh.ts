/**
 * Debounced, gated retrofit regeneration when evidence / screening inputs change materially.
 * Avoid importing esg-retrofit-planner at module top-level to prevent circular imports with services
 * that may eventually depend on rollout paths.
 *
 * Mutation anchors (persist → schedule):
 * - Evidence coverage/confidence rollup: `persistEsgEvidenceConfidenceRollup` (runs inside action generation).
 * - Action center generate + action status POST routes (fingerprints captured around writes).
 * - ESG profile PATCH (`/api/esg/profile`).
 * - Acquisition snapshots: `snapshotInvestmentOpportunities` (`modules/investment/investment.engine.ts`).
 * - Listing compliance acquisition context: `recomputeComplianceSnapshot` (`coownershipCompliance.service.ts`).
 *
 * Read-only APIs (GET profile, browse opportunities, etc.) do not call schedulers here.
 */

import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[retrofit]";

/** Per-listing debounce timer handles (avoid refresh storms). */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 450;

/** Earliest fingerprint in the debounce window (first writer wins). */
const pendingBefore = new Map<string, RetrofitUpstreamFingerprint | null>();

export type RetrofitUpstreamFingerprint = {
  profilePresent: boolean;
  evidenceConfidence: number | null;
  dataCoveragePercent: number | null;
  compositeScore: number | null;
  grade: string | null;
  acquisitionScore: number | null;
  acquisitionRiskLevel: string | null;
  complianceOverallPercent: number | null;
  blockingIssuesCount: number;
  openActions: number;
  criticalOpenActions: number;
};

function clamp01(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Serialize for stable shallow compare. */
export function fingerprintSignature(fp: RetrofitUpstreamFingerprint): string {
  return JSON.stringify({
    ...fp,
    evidenceConfidence: fp.evidenceConfidence != null ? clamp01(fp.evidenceConfidence) : null,
    dataCoveragePercent: fp.dataCoveragePercent != null ? clamp01(fp.dataCoveragePercent) : null,
    compositeScore: fp.compositeScore != null ? clamp01(fp.compositeScore) : null,
    acquisitionScore: fp.acquisitionScore != null ? clamp01(fp.acquisitionScore) : null,
    complianceOverallPercent: fp.complianceOverallPercent != null ? clamp01(fp.complianceOverallPercent) : null,
  });
}

/** Build acquisition-readiness-style band matching esg-retrofit-planner buildPlannerContext. */
export function acquisitionReadinessBand(fp: RetrofitUpstreamFingerprint): "UNKNOWN" | "PASS_LIKELY" | "CONDITIONAL" {
  const cs = fp.compositeScore ?? 0;
  const cov = fp.dataCoveragePercent ?? 0;
  const conf = fp.evidenceConfidence ?? 0;
  if (
    fp.compositeScore == null ||
    fp.dataCoveragePercent == null ||
    fp.evidenceConfidence == null ||
    cov === 0 ||
    conf === 0
  )
    return "CONDITIONAL";
  return cs >= 55 && cov >= 35 && conf >= 35 ? "PASS_LIKELY" : "CONDITIONAL";
}

/** True when retrofit planner inputs could meaningfully shift financing rules / phased posture. */
export function materialRetrofitUpstreamChange(
  before: RetrofitUpstreamFingerprint | null,
  after: RetrofitUpstreamFingerprint | null,
): boolean {
  if (!before || !after) return true;

  const bandBefore = acquisitionReadinessBand(before);
  const bandAfter = acquisitionReadinessBand(after);
  if (bandBefore !== bandAfter) return true;

  const delta = (a: number | null, b: number | null, thresh: number) =>
    a != null && b != null ? Math.abs(a - b) >= thresh : a !== b;

  if (delta(before.evidenceConfidence, after.evidenceConfidence, 1)) return true;
  if (delta(before.dataCoveragePercent, after.dataCoveragePercent, 1)) return true;
  if (delta(before.compositeScore, after.compositeScore, 2)) return true;
  if ((before.grade ?? "") !== (after.grade ?? "")) return true;

  if (delta(before.acquisitionScore, after.acquisitionScore, 2)) return true;
  if ((before.acquisitionRiskLevel ?? "") !== (after.acquisitionRiskLevel ?? "")) return true;

  if (delta(before.complianceOverallPercent, after.complianceOverallPercent, 2)) return true;
  if (before.blockingIssuesCount !== after.blockingIssuesCount) return true;

  if (before.openActions !== after.openActions) return true;
  if (before.criticalOpenActions !== after.criticalOpenActions) return true;

  return false;
}

export async function captureRetrofitUpstreamFingerprint(listingId: string): Promise<RetrofitUpstreamFingerprint | null> {
  const [profile, latestOpp, snap, actions] = await Promise.all([
    prisma.esgProfile.findUnique({
      where: { listingId },
      select: {
        evidenceConfidence: true,
        dataCoveragePercent: true,
        compositeScore: true,
        grade: true,
      },
    }),
    prisma.investmentOpportunity.findFirst({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      select: { score: true, riskLevel: true },
    }),
    prisma.listingComplianceSnapshot.findUnique({
      where: { listingId },
      select: { overallPercent: true, blockingIssuesJson: true },
    }),
    prisma.esgAction.groupBy({
      by: ["priority", "status"],
      where: { listingId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
      _count: { id: true },
    }),
  ]);

  let openActions = 0;
  let criticalOpenActions = 0;
  for (const row of actions) {
    const c = row._count.id;
    openActions += c;
    if (row.priority === "CRITICAL") criticalOpenActions += c;
  }

  const blockingRaw = snap?.blockingIssuesJson;
  const blockingIssuesCount = Array.isArray(blockingRaw) ? blockingRaw.length : 0;

  return {
    profilePresent: Boolean(profile),
    evidenceConfidence: profile?.evidenceConfidence ?? null,
    dataCoveragePercent: profile?.dataCoveragePercent ?? null,
    compositeScore: profile?.compositeScore ?? null,
    grade: profile?.grade ?? null,
    acquisitionScore: latestOpp?.score ?? null,
    acquisitionRiskLevel: latestOpp?.riskLevel ?? null,
    complianceOverallPercent: snap?.overallPercent ?? null,
    blockingIssuesCount,
    openActions,
    criticalOpenActions,
  };
}

async function runRetrofitRefresh(listingId: string): Promise<void> {
  const { refreshRetrofitAfterActionCenterUpdate } = await import("./esg-retrofit-planner.service");
  await refreshRetrofitAfterActionCenterUpdate(listingId);
}

export type UpstreamRefreshSource = "evidence" | "acquisition";

/**
 * Fire-and-forget retrofit regeneration after upstream persistence.
 * Debounced per listing to reduce storms when batch evidence/compliance writes occur.
 */
export function scheduleDebouncedRetrofitUpstreamRefresh(
  listingId: string,
  source: UpstreamRefreshSource,
  fingerprintBefore: RetrofitUpstreamFingerprint | null,
): void {
  if (!pendingBefore.has(listingId)) pendingBefore.set(listingId, fingerprintBefore);

  const prev = debounceTimers.get(listingId);
  if (prev) clearTimeout(prev);

  debounceTimers.set(
    listingId,
    setTimeout(() => {
      debounceTimers.delete(listingId);
      const fpBeforeWindow = pendingBefore.get(listingId) ?? null;
      pendingBefore.delete(listingId);
      void (async () => {
        const fpAfter = await captureRetrofitUpstreamFingerprint(listingId);
        if (!fpAfter) {
          logInfo(`${TAG} upstream_refresh_skipped_no_material_change`, { listingId, source, reason: "no_fingerprint" });
          return;
        }
        if (!materialRetrofitUpstreamChange(fpBeforeWindow, fpAfter)) {
          logInfo(`${TAG} upstream_refresh_skipped_no_material_change`, { listingId, source });
          return;
        }
        if (source === "evidence") {
          logInfo(`${TAG} upstream_refresh_source_evidence`, { listingId });
        } else {
          logInfo(`${TAG} upstream_refresh_source_acquisition`, { listingId });
        }
        logInfo(`${TAG} upstream_refresh_triggered`, { listingId, source });
        try {
          await runRetrofitRefresh(listingId);
        } catch {
          /* logged inside planner */
        }
      })();
    }, DEBOUNCE_MS),
  );
}
