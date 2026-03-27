import type { ContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import { emptyPillarCounts, type PillarCounts } from "@/src/modules/growth-automation/application/contentRotation";
import { extractTaxonomyPillarFromDraft } from "@/src/modules/growth-automation/application/taxonomyPayload";
import { listContentItemsSince } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export type TaxonomyRotationContext = {
  countsLast7Days: PillarCounts;
  /** Most recently created item’s pillar (for consecutive guard). */
  lastPillar: ContentPillar | null;
};

export async function loadTaxonomyRotationContext(since: Date): Promise<TaxonomyRotationContext> {
  const rows = await listContentItemsSince(since);
  const counts = emptyPillarCounts();
  const chronological = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const r of chronological) {
    const p = extractTaxonomyPillarFromDraft(r.draftPayload);
    if (p) counts[p] += 1;
  }
  const lastPillar = rows.length > 0 ? extractTaxonomyPillarFromDraft(rows[0]!.draftPayload) : null;
  return { countsLast7Days: counts, lastPillar };
}
