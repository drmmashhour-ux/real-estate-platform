import type { ContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import { contentFamilyToPillar, isContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

export function extractTaxonomyPillarFromDraft(draft: unknown): ContentPillar | null {
  if (!draft || typeof draft !== "object") return null;
  const d = draft as DraftPayload;
  const meta = d.metadata;
  if (meta && typeof meta === "object" && "taxonomyPillar" in meta) {
    const raw = (meta as { taxonomyPillar?: string }).taxonomyPillar;
    if (typeof raw === "string" && isContentPillar(raw)) return raw;
  }
  const cf = (meta as { contentFamily?: string } | undefined)?.contentFamily;
  if (typeof cf === "string") {
    return contentFamilyToPillar(cf as ContentFamily);
  }
  return null;
}

export function attachTaxonomyToDraft(
  draft: DraftPayload,
  args: { taxonomyPillar: ContentPillar; hookPattern?: string; contentFamily?: ContentFamily },
): DraftPayload {
  return {
    ...draft,
    metadata: {
      ...(draft.metadata ?? {}),
      taxonomyPillar: args.taxonomyPillar,
      ...(args.hookPattern ? { hookPattern: args.hookPattern } : {}),
      ...(args.contentFamily ? { contentFamily: args.contentFamily } : {}),
    },
  };
}
