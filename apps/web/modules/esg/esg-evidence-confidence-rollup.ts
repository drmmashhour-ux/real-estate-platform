/**
 * Derives listing-level evidence coverage / confidence scores from persisted evidence rows.
 * Invoke only after relevant evidence or document mutations (or explicitly after batch ingest).
 */

import { prisma } from "@/lib/db";
import { ensureEsgProfileForListing, syncEsgScoreForListing } from "@/modules/esg/esg.service";
import {
  captureRetrofitUpstreamFingerprint,
  materialRetrofitUpstreamChange,
  scheduleDebouncedRetrofitUpstreamRefresh,
  type RetrofitUpstreamFingerprint,
} from "@/modules/esg/esg-retrofit-upstream-refresh";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function quantizePercent(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Deterministic rollup from documents + evidence rows — conservative, non-predictive.
 */
export async function computeEvidenceCoverageConfidence(listingId: string): Promise<{
  dataCoveragePercent: number;
  evidenceConfidence: number;
}> {
  const [docRows, evidences] = await Promise.all([
    prisma.esgDocument.findMany({
      where: { listingId },
      select: { processingStatus: true },
    }),
    prisma.esgEvidence.findMany({
      where: { listingId },
      select: { verification: true },
    }),
  ]);

  const docCount = docRows.filter((d) => d.processingStatus !== "FAILED").length;
  const verified = evidences.filter((e) => e.verification === "VERIFIED").length;
  const estimated = evidences.filter((e) => e.verification === "ESTIMATED").length;

  const dataCoveragePercent = clamp(7 * Math.min(docCount, 12) + 5 * Math.min(verified, 14), 0, 100);
  const evidenceConfidence = clamp(
    6 * verified + 3 * estimated + 2 * Math.min(docCount, 8),
    0,
    100,
  );

  return {
    dataCoveragePercent: quantizePercent(dataCoveragePercent),
    evidenceConfidence: quantizePercent(evidenceConfidence),
  };
}

/**
 * Persists rollup to `EsgProfile`, rescores composite when relevant, then optionally schedules retrofit refresh.
 */
export async function persistEsgEvidenceConfidenceRollup(
  listingId: string,
  opts?: { scheduleRetrofitRefresh?: boolean },
): Promise<{ changed: boolean; before: RetrofitUpstreamFingerprint | null }> {
  const scheduleRefresh = opts?.scheduleRetrofitRefresh !== false;

  let fpBefore: RetrofitUpstreamFingerprint | null = null;
  if (scheduleRefresh) {
    fpBefore = await captureRetrofitUpstreamFingerprint(listingId);
  }

  await ensureEsgProfileForListing(listingId);
  const computed = await computeEvidenceCoverageConfidence(listingId);

  await prisma.esgProfile.update({
    where: { listingId },
    data: {
      dataCoveragePercent: computed.dataCoveragePercent,
      evidenceConfidence: computed.evidenceConfidence,
    },
  });

  await syncEsgScoreForListing(listingId);

  let fpAfter: RetrofitUpstreamFingerprint | null = null;
  if (scheduleRefresh && fpBefore) {
    fpAfter = await captureRetrofitUpstreamFingerprint(listingId);
  }

  const changed =
    fpBefore && fpAfter ? materialRetrofitUpstreamChange(fpBefore, fpAfter) : Boolean(fpBefore && fpAfter);

  if (scheduleRefresh && fpBefore && changed) {
    scheduleDebouncedRetrofitUpstreamRefresh(listingId, "evidence", fpBefore);
  }

  return { changed, before: fpBefore };
}
