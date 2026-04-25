import { searchVectors } from "@/lib/ai/vector-search";
import { rankSearchHits } from "@/lib/ai/source-ranking";
import { getAllowedSourcesForFormType } from "@/lib/ai/drafting-source-policy";
import { normalizeDraftingFormType, type DraftingFormType } from "@/lib/ai/drafting-policy";
import { getDraftingSourceMeta } from "@/lib/ai/source-registry";

export type RetrievedPassage = {
  sourceKey: string;
  sourceLabel: string;
  excerpt: string;
  confidence: number;
  lineRef?: string;
};

export type DraftingRetrievalInput = {
  formType:
    | "seller_declaration"
    | "brokerage_contract"
    | "promise_to_purchase"
    | "counter_proposal"
    | "annex_r"
    | "notice_fulfilment_conditions"
    | "identity_verification"
    | "disclosure"
    | "other"
    | string;
  userQuery: string;
  transactionType: "sale" | "purchase" | "lease" | "vacation_resort";
};

/**
 * Approved drafting sources only (`vector_documents`), ranked OACIQ > books via `rankSearchHits`.
 */
export async function retrieveDraftingContext(input: DraftingRetrievalInput): Promise<RetrievedPassage[]> {
  const ft: DraftingFormType = normalizeDraftingFormType(String(input.formType));
  const allowed = getAllowedSourcesForFormType(ft);

  const query = `${input.userQuery}\ncontext: form=${ft} transaction=${input.transactionType}`;

  const raw = await searchVectors(query, {
    limit: 60,
    chunkScanCap: 2500,
    allowedSourceKeys: allowed,
    origins: ["vector_document"],
  });

  const ranked = rankSearchHits(raw);

  return ranked.slice(0, 12).map((doc) => {
    const meta = getDraftingSourceMeta(doc.sourceKey);
    return {
      sourceKey: doc.sourceKey,
      sourceLabel: meta?.label ?? doc.title ?? doc.sourceKey,
      excerpt: doc.content,
      confidence: doc.weightedScore,
    };
  });
}
