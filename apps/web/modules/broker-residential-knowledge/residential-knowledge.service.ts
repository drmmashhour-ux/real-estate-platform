import type { ResidentialKnowledgeAttribution } from "./residential-knowledge.types";
import { listActiveClauseRefsForBroker } from "./residential-clause-source.service";
import { countKnowledgeIngestions, listDraftingSourceSummaries } from "./residential-drafting-reference.service";

export async function getResidentialKnowledgeIndex() {
  const [clauses, sources, ingestionCount] = await Promise.all([
    listActiveClauseRefsForBroker({ take: 12 }),
    listDraftingSourceSummaries(12),
    countKnowledgeIngestions(),
  ]);
  return {
    clauseRefs: clauses,
    draftingSources: sources,
    registeredIngestions: ingestionCount,
    disclaimer:
      "References point to brokerage-curated materials. Verify against current OACIQ and office policy before reliance.",
  };
}

export function attributionFromClauseTemplate(row: {
  id: string;
  title: string;
  sourceReference: string;
}): ResidentialKnowledgeAttribution {
  return {
    kind: "clause_library",
    referenceLabel: row.title,
    detail: row.sourceReference,
    requiresBrokerReview: true,
  };
}
