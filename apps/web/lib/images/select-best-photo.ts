import type { FsboPhotoType } from "@/lib/fsbo/photo-limits";
import { scorePhoto } from "@/lib/images/photo-score";

export type PhotoCandidate = {
  buffer: Buffer;
};

export type RankCoverPhotosOptions = {
  listingKind?: "stay" | "sale";
  /** Parallel tags aligned with candidates */
  photoTypes?: (FsboPhotoType | string | undefined)[];
};

export type RankedPhotoRow = {
  index: number;
  score: number;
  reasons: string[];
};

const EXTERIOR_COVER_BONUS = 12;

/**
 * Scores each candidate buffer (parallel) and picks the best cover index.
 */
export async function rankListingPhotosForCover(
  candidates: PhotoCandidate[],
  opts?: RankCoverPhotosOptions,
): Promise<{ scores: RankedPhotoRow[]; bestIndex: number }> {
  const listingKind = opts?.listingKind ?? "sale";
  const photoTypes = opts?.photoTypes ?? [];

  const scored = await Promise.all(
    candidates.map(async (c, index) => {
      const base = await scorePhoto(c.buffer, undefined, { listingKind });
      let score = base.score;
      const reasons = [...base.reasons];
      const tag = photoTypes[index];
      if (tag === "EXTERIOR") {
        score = Math.min(100, score + EXTERIOR_COVER_BONUS);
        reasons.push("exterior_tag_bonus");
      }
      return { index, score, reasons };
    }),
  );

  let bestIndex = 0;
  let bestScore = -1;
  for (const row of scored) {
    if (row.score > bestScore) {
      bestScore = row.score;
      bestIndex = row.index;
    }
  }

  return { scores: scored, bestIndex };
}
